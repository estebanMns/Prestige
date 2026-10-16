import "server-only";
import type { NextRequest } from "next/server";
import type { Actor } from "@/core/domain/auth/Actor";
import type { AccessTokenCodec } from "@/infrastructure/security/jwt/AccessTokenCodec";
import type { RefreshTokenRepository } from "@/core/application/ports/repositories";
import type { Clock } from "@/core/application/ports/services";
import { SessionCookies } from "./SessionCookies";

/** Extrae de la petición la información que necesitan los controladores: actor autenticado e IP. */
export class RequestContext {
  constructor(
    private readonly codec: AccessTokenCodec,
    private readonly sessions: RefreshTokenRepository,
    private readonly clock: Clock,
  ) {}

  async actor(request: NextRequest): Promise<Actor | null> {
    const token = request.cookies.get(SessionCookies.ACCESS)?.value;
    if (!token) return null;
    const claims = await this.codec.verify(token);
    if (!claims) return null;
    // Una sesión cerrada (por otro inicio de sesión o por cierre manual) invalida el JWT aunque no haya expirado.
    const active = await this.sessions.hasActiveFamily(claims.sessionId, this.clock.now());
    return active ? claims : null;
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
