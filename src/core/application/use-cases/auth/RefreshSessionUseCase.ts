import { UnauthenticatedError } from "../../../domain/shared/DomainError";
import type { AuditLogRepository, RefreshTokenRepository, UserRepository } from "../../ports/repositories";
import type { Clock, OpaqueTokenGenerator } from "../../ports/services";
import type { UseCase } from "../../ports/UseCase";
import type { IssuedSession, SessionIssuer } from "../../services/SessionIssuer";

/**
 * Renueva la sesión con rotación de refresh token.
 * Si llega un token ya revocado, alguien lo está reutilizando (posible robo):
 * se revoca toda la familia y se obliga a iniciar sesión de nuevo.
 */
export class RefreshSessionUseCase implements UseCase<{ refreshToken: string }, IssuedSession> {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly users: UserRepository,
    private readonly opaqueTokens: OpaqueTokenGenerator,
    private readonly sessions: SessionIssuer,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ refreshToken }: { refreshToken: string }): Promise<IssuedSession> {
    if (!refreshToken) throw new UnauthenticatedError();
    const now = this.clock.now();
    const stored = await this.refreshTokens.findByHash(this.opaqueTokens.hash(refreshToken));
    if (!stored) throw new UnauthenticatedError();

    if (stored.isRevoked()) {
      await this.refreshTokens.revokeFamily(stored.familyId, now);
      await this.audit.record({
        actorId: stored.userId,
        action: "auth.token_reuse_detected",
        entity: "user",
        entityId: stored.userId,
        details: { familyId: stored.familyId },
        at: now,
      });
      throw new UnauthenticatedError("Por seguridad cerramos tu sesión. Inicia sesión de nuevo.");
    }
    if (stored.isExpired(now)) throw new UnauthenticatedError();

    const user = await this.users.findById(stored.userId);
    if (!user || user.isLocked(now)) throw new UnauthenticatedError();

    stored.revoke(now);
    await this.refreshTokens.save(stored);
    return this.sessions.issue(user, stored.familyId);
  }
}
