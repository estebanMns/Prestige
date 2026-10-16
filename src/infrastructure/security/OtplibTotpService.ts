import "server-only";
import { authenticator } from "otplib";
import type { TotpService } from "@/core/application/ports/services";

/** Doble factor TOTP compatible con Google Authenticator, Microsoft Authenticator y similares. */
export class OtplibTotpService implements TotpService {
  constructor(private readonly issuer: string) {
    // Acepta el código anterior y el siguiente (±30 s) para tolerar relojes desfasados.
    authenticator.options = { window: 1 };
  }

  generateSecret(): string {
    return authenticator.generateSecret(20);
  }

  keyUri(accountName: string, secret: string): string {
    return authenticator.keyuri(accountName, this.issuer, secret);
  }

  verify(code: string, secret: string): boolean {
    const clean = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(clean)) return false;
    try {
      return authenticator.check(clean, secret);
    } catch {
      return false;
    }
  }
}
