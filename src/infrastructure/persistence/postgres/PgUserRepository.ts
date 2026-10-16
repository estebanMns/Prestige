import type { Pool } from "pg";
import type { UserRepository } from "@/core/application/ports/repositories";
import { Email } from "@/core/domain/shared/Email";
import { User } from "@/core/domain/user/User";
import type { UserRow } from "./rows";

export class PgUserRepository implements UserRepository {
  constructor(private readonly db: Pool) {}

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.db.query<UserRow>("SELECT * FROM users WHERE email = $1", [email]);
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async findById(id: string): Promise<User | null> {
    const { rows } = await this.db.query<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async save(user: User): Promise<void> {
    await this.db.query(
      `INSERT INTO users (id, email, password_hash, role, totp_secret, totp_enabled, failed_login_count, locked_until, last_login_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role,
         totp_secret = EXCLUDED.totp_secret, totp_enabled = EXCLUDED.totp_enabled,
         failed_login_count = EXCLUDED.failed_login_count, locked_until = EXCLUDED.locked_until,
         last_login_at = EXCLUDED.last_login_at, updated_at = now()`,
      [
        user.id,
        user.email.value,
        user.passwordHash,
        user.role,
        user.totpSecret,
        user.totpEnabled,
        user.failedLoginCount,
        user.lockedUntil,
        user.lastLoginAt,
      ],
    );
  }

  private toDomain(row: UserRow): User {
    return User.restore(row.id, {
      email: Email.create(row.email),
      passwordHash: row.password_hash,
      role: row.role,
      totpSecret: row.totp_secret,
      totpEnabled: row.totp_enabled,
      failedLoginCount: row.failed_login_count,
      lockedUntil: row.locked_until,
      lastLoginAt: row.last_login_at,
    });
  }
}
