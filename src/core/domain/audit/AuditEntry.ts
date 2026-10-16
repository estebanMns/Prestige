export type AuditAction =
  | "perfume.created"
  | "perfume.updated"
  | "perfume.deleted"
  | "settings.updated"
  | "auth.login"
  | "auth.login_failed"
  | "auth.locked"
  | "auth.token_reuse_detected"
  | "auth.totp_enabled"
  | "auth.password_changed";

/** Registro inmutable de una acción sensible: quién, qué, sobre qué y cuándo. */
export interface AuditEntry {
  actorId: string | null;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  details?: Record<string, unknown>;
  at: Date;
}
