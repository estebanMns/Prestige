import type { AccessTokenClaims, AccessTokenService, Clock } from "@/core/application/ports/services";
import { UnauthenticatedError } from "@/core/domain/shared/DomainError";
import type { AccessTokenCodec } from "./jwt/AccessTokenCodec";

/** Adaptador del puerto AccessTokenService sobre el códec JWT. */
export class JoseAccessTokenService implements AccessTokenService {
  constructor(
    private readonly codec: AccessTokenCodec,
    private readonly clock: Clock,
  ) {}

  sign(claims: AccessTokenClaims) {
    return this.codec.sign(claims, this.clock.now());
  }

  async verify(token: string): Promise<AccessTokenClaims> {
    const decoded = await this.codec.verify(token);
    if (!decoded) throw new UnauthenticatedError();
    return decoded;
  }
}
