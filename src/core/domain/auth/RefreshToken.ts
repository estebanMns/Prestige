import { Entity } from "../shared/Entity";

export interface RefreshTokenProps {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

/**
 * Refresh token persistido (solo su hash). Se rota en cada uso: el token usado se revoca
 * y se emite uno nuevo de la misma familia. Si un token ya revocado vuelve a presentarse,
 * es señal de robo y se revoca toda la familia.
 */
export class RefreshToken extends Entity<RefreshTokenProps> {
  static issue(id: string, userId: string, tokenHash: string, familyId: string, expiresAt: Date): RefreshToken {
    return new RefreshToken(id, { userId, tokenHash, familyId, expiresAt, revokedAt: null });
  }

  static restore(id: string, props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(id, props);
  }

  get userId(): string {
    return this.props.userId;
  }
  get tokenHash(): string {
    return this.props.tokenHash;
  }
  get familyId(): string {
    return this.props.familyId;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }

  isRevoked(): boolean {
    return this.props.revokedAt !== null;
  }

  isExpired(now: Date): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  revoke(now: Date): void {
    if (!this.props.revokedAt) this.props.revokedAt = now;
  }
}
