import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { FileStorage } from "@/core/application/ports/services";

/**
 * Fotos en AWS S3 con subida directa desde el navegador mediante URL prefirmada (válida 5 minutos).
 * Las credenciales las toma el SDK del rol IAM del servidor; no van en variables de entorno.
 * En Azure se implementaría la misma interfaz con Blob Storage y tokens SAS.
 */
export class S3FileStorage implements FileStorage {
  private readonly client: S3Client;

  constructor(
    private readonly bucket: string,
    region: string,
    private readonly publicBaseUrl: string,
  ) {
    this.client = new S3Client({ region });
  }

  async createUploadUrl(key: string, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });
    return { uploadUrl, method: "PUT" as const };
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
