import type { RefreshTokenRepository } from "../../ports/repositories";
import type { Clock, OpaqueTokenGenerator } from "../../ports/services";
import type { UseCase } from "../../ports/UseCase";

/** Cierra la sesión revocando la familia completa del refresh token presentado. */
export class LogoutUseCase implements UseCase<{ refreshToken: string | null }, void> {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly opaqueTokens: OpaqueTokenGenerator,
    private readonly clock: Clock,
  ) {}

  async execute({ refreshToken }: { refreshToken: string | null }): Promise<void> {
    if (!refreshToken) return;
    const stored = await this.refreshTokens.findByHash(this.opaqueTokens.hash(refreshToken));
    if (stored) await this.refreshTokens.revokeFamily(stored.familyId, this.clock.now());
  }
}
