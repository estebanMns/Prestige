import { RefreshToken } from "../../domain/auth/RefreshToken";
import type { User } from "../../domain/user/User";
import type { RefreshTokenRepository } from "../ports/repositories";
import type { AccessTokenService, Clock, IdGenerator, OpaqueTokenGenerator } from "../ports/services";

export interface IssuedSession {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

/**
 * Emite el par de tokens de una sesión: un JWT de acceso de vida corta y un refresh token opaco
 * de vida larga que se guarda hasheado. Lo usan tanto el inicio de sesión como la renovación.
 */
export class SessionIssuer {
  constructor(
    private readonly accessTokens: AccessTokenService,
    private readonly opaqueTokens: OpaqueTokenGenerator,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly refreshTtlDays: number,
  ) {}

  /**
   * Inicio de sesión: cierra todas las sesiones anteriores del usuario y abre una nueva.
   * Así una cuenta solo tiene una sesión activa a la vez.
   */
  async start(user: User): Promise<IssuedSession> {
    const now = this.clock.now();
    await this.refreshTokens.revokeAllForUser(user.id, now);
    return this.issue(user, this.ids.uuid());
  }

  /** Renovación: mantiene la misma familia (sesión). */
  async issue(user: User, familyId: string): Promise<IssuedSession> {
    const { token: accessToken, expiresAt: accessTokenExpiresAt } = await this.accessTokens.sign({
      userId: user.id,
      email: user.email.value,
      role: user.role,
      sessionId: familyId,
    });
    const { raw, hash } = this.opaqueTokens.generate();
    const refreshTokenExpiresAt = new Date(this.clock.now().getTime() + this.refreshTtlDays * 86_400_000);
    await this.refreshTokens.save(RefreshToken.issue(this.ids.uuid(), user.id, hash, familyId, refreshTokenExpiresAt));
    return { accessToken, accessTokenExpiresAt, refreshToken: raw, refreshTokenExpiresAt };
  }
}
