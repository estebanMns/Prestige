import type { Actor } from "../../../domain/auth/Actor";
import type { AuditEntry } from "../../../domain/audit/AuditEntry";
import { Permission } from "../../../domain/user/Role";
import type { AuditLogRepository } from "../../ports/repositories";
import type { UseCase } from "../../ports/UseCase";
import type { AuthorizationService } from "../../services/AuthorizationService";

export class ListAuditLogUseCase implements UseCase<{ actor: Actor | null; limit?: number }, AuditEntry[]> {
  constructor(
    private readonly audit: AuditLogRepository,
    private readonly authz: AuthorizationService,
  ) {}

  async execute({ actor, limit = 50 }: { actor: Actor | null; limit?: number }): Promise<AuditEntry[]> {
    this.authz.ensure(actor, Permission.AuditRead);
    return this.audit.latest(Math.min(Math.max(limit, 1), 200));
  }
}
