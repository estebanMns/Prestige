import "server-only";
import type { NextRequest } from "next/server";
import type { Actor } from "@/core/domain/auth/Actor";
import type { AccessTokenCodec } from "@/infrastructure/security/jwt/AccessTokenCodec";
import { SessionCookies } from "./SessionCookies";

/** Extrae de la petición la información que necesitan los controladores: actor autenticado e IP. */
export class RequestContext {
  constructor(private readonly codec: AccessTokenCodec) {}

  async actor(request: NextRequest): Promise<Actor | null> {
    const token = request.cookies.get(SessionCookies.ACCESS)?.value;
    if (!token) return null;
    return this.codec.verify(token);
  }

  refreshToken(request: NextRequest): string | null {
    return request.cookies.get(SessionCookies.REFRESH)?.value ?? null;
  }

  /** IP del cliente detrás del balanceador (AWS ALB / Azure Front Door envían X-Forwarded-For). */
  clientIp(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    return forwarded || request.headers.get("x-real-ip") || "unknown";
  }
}
