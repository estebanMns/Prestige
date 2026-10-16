import { SignJWT, jwtVerify, errors } from "jose";
import type { Role } from "@/core/domain/user/Role";
import { ROLES } from "@/core/domain/user/Role";

export interface AccessTokenSettings {
  secret: string;
  issuer: string;
  audience: string;
  ttlSeconds: number;
}

export interface DecodedAccessToken {
  userId: string;
  email: string;
  role: Role;
}

/**
 * Firma y verifica JWT de acceso (HS256) con `jose`.
 * No depende de Node.js: funciona igual en el middleware (Edge Runtime) y en las rutas del servidor.
 */
export class AccessTokenCodec {
  private static readonly ALGORITHM = "HS256";
  private readonly key: Uint8Array;

  constructor(private readonly settings: AccessTokenSettings) {
    this.key = new TextEncoder().encode(settings.secret);
  }

  async sign(claims: DecodedAccessToken, now = new Date()): Promise<{ token: string; expiresAt: Date }> {
    const issuedAt = Math.floor(now.getTime() / 1000);
    const expiresAt = new Date((issuedAt + this.settings.ttlSeconds) * 1000);
    const token = await new SignJWT({ email: claims.email, role: claims.role })
      .setProtectedHeader({ alg: AccessTokenCodec.ALGORITHM, typ: "JWT" })
      .setSubject(claims.userId)
      .setIssuer(this.settings.issuer)
      .setAudience(this.settings.audience)
      .setIssuedAt(issuedAt)
      .setNotBefore(issuedAt)
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .setJti(crypto.randomUUID())
      .sign(this.key);
    return { token, expiresAt };
  }

  /** Devuelve los datos del token o null si está vencido, alterado o mal formado. */
  async verify(token: string): Promise<DecodedAccessToken | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: [AccessTokenCodec.ALGORITHM],
        issuer: this.settings.issuer,
        audience: this.settings.audience,
      });
      const role = payload.role;
      if (typeof payload.sub !== "string" || typeof payload.email !== "string" || !(ROLES as readonly unknown[]).includes(role)) {
        return null;
      }
      return { userId: payload.sub, email: payload.email, role: role as Role };
    } catch (error) {
      if (error instanceof errors.JOSEError) return null;
      throw error;
    }
  }
}
