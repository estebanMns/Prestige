import type { NextRequest } from "next/server";
import type { ListAuditLogUseCase } from "@/core/application/use-cases/audit/ListAuditLogUseCase";
import type {
  CreatePerfumeUseCase,
  DeletePerfumeUseCase,
  UpdatePerfumeUseCase,
} from "@/core/application/use-cases/perfumes/ManagePerfumeUseCases";
import type { RequestImageUploadUseCase } from "@/core/application/use-cases/perfumes/RequestImageUploadUseCase";
import type { UpdateStoreSettingsUseCase } from "@/core/application/use-cases/settings/StoreSettingsUseCases";
import { ForbiddenError, ValidationError } from "@/core/domain/shared/DomainError";
import { Permission } from "@/core/domain/user/Role";
import type { AuthorizationService } from "@/core/application/services/AuthorizationService";
import { LocalFileStorage } from "@/infrastructure/storage/LocalFileStorage";
import type { RequestContext } from "../RequestContext";
import { perfumeDraftSchema, storeSettingsSchema, uploadTicketSchema } from "../schemas";
import { BaseController } from "./BaseController";

/** Endpoints protegidos del panel. La autorización la decide cada caso de uso según el rol del actor. */
export class AdminController extends BaseController {
  constructor(
    private readonly context: RequestContext,
    private readonly authz: AuthorizationService,
    private readonly createPerfume: CreatePerfumeUseCase,
    private readonly updatePerfume: UpdatePerfumeUseCase,
    private readonly deletePerfume: DeletePerfumeUseCase,
    private readonly requestUpload: RequestImageUploadUseCase,
    private readonly updateSettings: UpdateStoreSettingsUseCase,
    private readonly listAudit: ListAuditLogUseCase,
    private readonly localStorage: LocalFileStorage | null,
  ) {
    super();
  }

  create = (request: NextRequest) =>
    this.handle(async () => {
      const draft = await this.body(request, perfumeDraftSchema);
      const perfume = await this.createPerfume.execute({ actor: await this.context.actor(request), draft });
      return this.ok(perfume, { status: 201 });
    });

  update = (request: NextRequest, id: string) =>
    this.handle(async () => {
      const draft = await this.body(request, perfumeDraftSchema);
      return this.ok(await this.updatePerfume.execute({ actor: await this.context.actor(request), id, draft }));
    });

  remove = (request: NextRequest, id: string) =>
    this.handle(async () => {
      await this.deletePerfume.execute({ actor: await this.context.actor(request), id });
      return this.noContent();
    });

  uploadTicket = (request: NextRequest) =>
    this.handle(async () => {
      const input = await this.body(request, uploadTicketSchema);
      return this.ok(await this.requestUpload.execute({ actor: await this.context.actor(request), ...input }));
    });

  /** Recibe la foto en desarrollo local (en producción el navegador sube directo a S3). */
  localUpload = (request: NextRequest) =>
    this.handle(async () => {
      if (!this.localStorage) throw new ForbiddenError("La subida local está desactivada en este entorno.");
      this.authz.ensure(await this.context.actor(request), Permission.ImageUpload);
      const key = request.nextUrl.searchParams.get("key") ?? "";
      if (!LocalFileStorage.isValidKey(key)) throw new ValidationError("Clave de archivo no válida.", "key");
      const bytes = new Uint8Array(await request.arrayBuffer());
      if (bytes.byteLength === 0 || bytes.byteLength > 5 * 1024 * 1024) throw new ValidationError("La foto debe pesar entre 1 byte y 5 MB.", "image");
      await this.localStorage.write(key, bytes);
      return this.noContent();
    });

  saveSettings = (request: NextRequest) =>
    this.handle(async () => {
      const input = await this.body(request, storeSettingsSchema);
      return this.ok(await this.updateSettings.execute({ actor: await this.context.actor(request), input }));
    });

  audit = (request: NextRequest) =>
    this.handle(async () => {
      const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
      return this.ok(await this.listAudit.execute({ actor: await this.context.actor(request), limit }));
    });
}
