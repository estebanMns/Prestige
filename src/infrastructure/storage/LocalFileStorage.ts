import "server-only";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileStorage } from "@/core/application/ports/services";

/**
 * Almacenamiento en disco para desarrollo local: las fotos quedan en /public/uploads.
 * Imita el flujo de S3 (URL de subida + PUT) para que la interfaz no cambie entre entornos.
 */
export class LocalFileStorage implements FileStorage {
  private static readonly KEY_PATTERN = /^perfumes\/[0-9a-f-]{36}\.(jpg|png|webp)$/;
  private readonly root = path.join(process.cwd(), "public", "uploads");

  async createUploadUrl(key: string) {
    return { uploadUrl: `/api/admin/uploads/local?key=${encodeURIComponent(key)}`, method: "PUT" as const };
  }

  publicUrl(key: string): string {
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    if (!LocalFileStorage.isValidKey(key)) return;
    await rm(path.join(this.root, key), { force: true });
  }

  async write(key: string, data: Uint8Array): Promise<void> {
    if (!LocalFileStorage.isValidKey(key)) throw new Error("Clave de archivo no válida.");
    const target = path.join(this.root, key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data);
  }

  /** Evita rutas manipuladas (../) aceptando solo las claves que genera RequestImageUploadUseCase. */
  static isValidKey(key: string): boolean {
    return LocalFileStorage.KEY_PATTERN.test(key);
  }
}
