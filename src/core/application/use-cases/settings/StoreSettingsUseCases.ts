import type { Actor } from "../../../domain/auth/Actor";
import { StoreSettings, type StoreSettingsProps } from "../../../domain/settings/StoreSettings";
import { Permission } from "../../../domain/user/Role";
import type { AuditLogRepository, StoreSettingsRepository } from "../../ports/repositories";
import type { Clock } from "../../ports/services";
import type { UseCase } from "../../ports/UseCase";
import type { AuthorizationService } from "../../services/AuthorizationService";

export class GetStoreSettingsUseCase implements UseCase<void, StoreSettingsProps> {
  constructor(private readonly settings: StoreSettingsRepository) {}

  async execute(): Promise<StoreSettingsProps> {
    return (await this.settings.get()).toJSON();
  }
}

export class UpdateStoreSettingsUseCase implements UseCase<{ actor: Actor | null; input: StoreSettingsProps }, StoreSettingsProps> {
  constructor(
    private readonly settings: StoreSettingsRepository,
    private readonly authz: AuthorizationService,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ actor, input }: { actor: Actor | null; input: StoreSettingsProps }): Promise<StoreSettingsProps> {
    const who = this.authz.ensure(actor, Permission.SettingsUpdate);
    const settings = StoreSettings.create(input);
    await this.settings.save(settings);
    await this.audit.record({ actorId: who.userId, action: "settings.updated", entity: "settings", entityId: "1", at: this.clock.now() });
    return settings.toJSON();
  }
}
