import type { Actor } from "../../../domain/auth/Actor";
import { ValidationError } from "../../../domain/shared/DomainError";
import { Permission } from "../../../domain/user/Role";
import type { FileStorage, IdGenerator } from "../../ports/services";
import type { UseCase } from "../../ports/UseCase";
import type { AuthorizationService } from "../../services/AuthorizationService";

export interface ImageUploadTicket {
  key: string;
  uploadUrl: string;
  method: "PUT";
  publicUrl: string;
}

/**
 * Entrega una URL firmada para que el navegador suba la foto directamente al almacenamiento.
 * El servidor nunca recibe el archivo, solo decide el nombre y el tipo permitido.
 */
export class RequestImageUploadUseCase implements UseCase<{ actor: Actor | null; contentType: string; sizeBytes: number }, ImageUploadTicket> {
  static readonly ALLOWED_TYPES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  static readonly MAX_BYTES = 5 * 1024 * 1024;

  constructor(
    private readonly storage: FileStorage,
    private readonly authz: AuthorizationService,
    private readonly ids: IdGenerator,
  ) {}

  async execute({ actor, contentType, sizeBytes }: { actor: Actor | null; contentType: string; sizeBytes: number }): Promise<ImageUploadTicket> {
    this.authz.ensure(actor, Permission.ImageUpload);
    const extension = RequestImageUploadUseCase.ALLOWED_TYPES[contentType];
    if (!extension) throw new ValidationError("Sube la foto en JPG, PNG o WEBP.", "image");
    if (sizeBytes > RequestImageUploadUseCase.MAX_BYTES) throw new ValidationError("La foto no puede pesar más de 5 MB.", "image");
    const key = `perfumes/${this.ids.uuid()}.${extension}`;
    const { uploadUrl, method } = await this.storage.createUploadUrl(key, contentType);
    return { key, uploadUrl, method, publicUrl: this.storage.publicUrl(key) };
  }
}
