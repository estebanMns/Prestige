import type { Pool } from "pg";
import type { RefreshTokenRepository } from "@/core/application/ports/repositories";
import { RefreshToken } from "@/core/domain/auth/RefreshToken";
import type { RefreshTokenRow } from "./rows";

export class PgRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly db: Pool) {}

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const { rows } = await this.db.query<RefreshTokenRow>("SELECT * FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);
    const row = rows[0];
    return row
      ? RefreshToken.restore(row.id, {
          userId: row.user_id,
          tokenHash: row.token_hash,
          familyId: row.family_id,
          expiresAt: row.expires_at,
          revokedAt: row.revoked_at,
        })
      : null;
  }

  async save(token: RefreshToken): Promise<void> {
    await this.db.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, expires_at, revoked_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET revoked_at = EXCLUDED.revoked_at`,
      [token.id, token.userId, token.tokenHash, token.familyId, token.expiresAt, token.revokedAt],
    );
  }

  async revokeFamily(familyId: string, at: Date): Promise<void> {
    await this.db.query("UPDATE refresh_tokens SET revoked_at = $2 WHERE family_id = $1 AND revoked_at IS NULL", [familyId, at]);
  }

  async revokeAllForUser(userId: string, at: Date): Promise<void> {
    await this.db.query("UPDATE refresh_tokens SET revoked_at = $2 WHERE user_id = $1 AND revoked_at IS NULL", [userId, at]);
  }
}
