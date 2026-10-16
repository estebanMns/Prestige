import type { Actor } from "../../../domain/auth/Actor";
import { Perfume, type PerfumeDraft } from "../../../domain/perfume/Perfume";
import { NotFoundError } from "../../../domain/shared/DomainError";
import { Slug } from "../../../domain/shared/Slug";
import { Permission } from "../../../domain/user/Role";
import type { PerfumeDTO, PerfumePresenter } from "../../dto/PerfumeDTO";
import type { AuditLogRepository, PerfumeRepository } from "../../ports/repositories";
import type { Clock, FileStorage, IdGenerator } from "../../ports/services";
import type { UseCase } from "../../ports/UseCase";
import type { AuthorizationService } from "../../services/AuthorizationService";

export class CreatePerfumeUseCase implements UseCase<{ actor: Actor | null; draft: PerfumeDraft }, PerfumeDTO> {
  constructor(
    private readonly perfumes: PerfumeRepository,
    private readonly authz: AuthorizationService,
    private readonly presenter: PerfumePresenter,
    private readonly audit: AuditLogRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute({ actor, draft }: { actor: Actor | null; draft: PerfumeDraft }): Promise<PerfumeDTO> {
    const who = this.authz.ensure(actor, Permission.PerfumeCreate);
    const now = this.clock.now();
    const perfume = Perfume.create(this.ids.uuid(), await this.uniqueSlug(`${draft.house} ${draft.name}`), draft, now);
    await this.perfumes.save(perfume);
    await this.audit.record({ actorId: who.userId, action: "perfume.created", entity: "perfume", entityId: perfume.id, details: { name: perfume.name }, at: now });
    return this.presenter.toDTO(perfume);
  }

  private async uniqueSlug(text: string): Promise<string> {
    const base = Slug.fromText(text);
    if (!(await this.perfumes.slugExists(base.value))) return base.value;
    return base.withSuffix(this.ids.shortCode(4).toLowerCase()).value;
  }
}

export class UpdatePerfumeUseCase implements UseCase<{ actor: Actor | null; id: string; draft: PerfumeDraft }, PerfumeDTO> {
  constructor(
    private readonly perfumes: PerfumeRepository,
    private readonly authz: AuthorizationService,
    private readonly presenter: PerfumePresenter,
    private readonly storage: FileStorage,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ actor, id, draft }: { actor: Actor | null; id: string; draft: PerfumeDraft }): Promise<PerfumeDTO> {
    const who = this.authz.ensure(actor, Permission.PerfumeUpdate);
    const perfume = await this.perfumes.findById(id);
    if (!perfume) throw new NotFoundError("Perfume");
    const previousImage = perfume.imageKey;
    const now = this.clock.now();
    perfume.update(draft, now);
    await this.perfumes.save(perfume);
    if (previousImage && previousImage !== perfume.imageKey) await this.storage.delete(previousImage).catch(() => undefined);
    await this.audit.record({ actorId: who.userId, action: "perfume.updated", entity: "perfume", entityId: id, details: { name: perfume.name }, at: now });
    return this.presenter.toDTO(perfume);
  }
}

export class DeletePerfumeUseCase implements UseCase<{ actor: Actor | null; id: string }, void> {
  constructor(
    private readonly perfumes: PerfumeRepository,
    private readonly authz: AuthorizationService,
    private readonly storage: FileStorage,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ actor, id }: { actor: Actor | null; id: string }): Promise<void> {
    const who = this.authz.ensure(actor, Permission.PerfumeDelete);
    const perfume = await this.perfumes.findById(id);
    if (!perfume) throw new NotFoundError("Perfume");
    await this.perfumes.delete(id);
    if (perfume.imageKey) await this.storage.delete(perfume.imageKey).catch(() => undefined);
    await this.audit.record({ actorId: who.userId, action: "perfume.deleted", entity: "perfume", entityId: id, details: { name: perfume.name }, at: this.clock.now() });
  }
}
