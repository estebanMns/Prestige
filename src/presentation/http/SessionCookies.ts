import type { NextResponse } from "next/server";
import type { IssuedSession } from "@/core/application/services/SessionIssuer";

/**
 * Nombres y opciones de las cookies de sesión. Ambas son httpOnly (JavaScript no puede leerlas),
 * Secure en producción y SameSite=Strict (no viajan en peticiones desde otros sitios: protección CSRF).
 * El refresh token solo se envía a /api/auth, nunca al resto de la aplicación.
 */
export class SessionCookies {
  static readonly ACCESS = "pp_access";
  static readonly REFRESH = "pp_refresh";
  static readonly REFRESH_PATH = "/api/auth";

  private static base() {
    return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const };
  }

  static write(response: NextResponse, session: IssuedSession): NextResponse {
    response.cookies.set(SessionCookies.ACCESS, session.accessToken, {
      ...SessionCookies.base(),
      path: "/",
      expires: session.accessTokenExpiresAt,
    });
    response.cookies.set(SessionCookies.REFRESH, session.refreshToken, {
      ...SessionCookies.base(),
      path: SessionCookies.REFRESH_PATH,
      expires: session.refreshTokenExpiresAt,
    });
    return response;
  }

  static clear(response: NextResponse): NextResponse {
    response.cookies.set(SessionCookies.ACCESS, "", { ...SessionCookies.base(), path: "/", maxAge: 0 });
    response.cookies.set(SessionCookies.REFRESH, "", { ...SessionCookies.base(), path: SessionCookies.REFRESH_PATH, maxAge: 0 });
    return response;
  }
}
