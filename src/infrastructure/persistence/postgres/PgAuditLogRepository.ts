import type { Pool } from "pg";
import type { AuditLogRepository } from "@/core/application/ports/repositories";
import type { AuditAction, AuditEntry } from "@/core/domain/audit/AuditEntry";
import type { AuditLogRow } from "./rows";

export class PgAuditLogRepository implements AuditLogRepository {
  constructor(private readonly db: Pool) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.db.query(
      "INSERT INTO audit_logs (actor_id, action, entity, entity_id, details, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [entry.actorId, entry.action, entry.entity, entry.entityId, entry.details ? JSON.stringify(entry.details) : null, entry.at],
    );
  }

  async latest(limit: number): Promise<AuditEntry[]> {
    const { rows } = await this.db.query<AuditLogRow>("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1", [limit]);
    return rows.map((r) => ({
      actorId: r.actor_id,
      action: r.action as AuditAction,
      entity: r.entity,
      entityId: r.entity_id,
      details: r.details ?? undefined,
      at: r.created_at,
    }));
  }
}
