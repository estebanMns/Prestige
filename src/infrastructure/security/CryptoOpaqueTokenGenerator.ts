import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { OpaqueTokenGenerator } from "@/core/application/ports/services";

/**
 * Refresh tokens opacos: 48 bytes aleatorios en base64url. En la base de datos solo se guarda
 * su SHA-256, así una filtración de la tabla no permite suplantar sesiones.
 */
export class CryptoOpaqueTokenGenerator implements OpaqueTokenGenerator {
  generate(): { raw: string; hash: string } {
    const raw = randomBytes(48).toString("base64url");
    return { raw, hash: this.hash(raw) };
  }

  hash(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }
}
