import { NextResponse, type NextRequest } from "next/server";
import { AccessTokenCodec } from "@/infrastructure/security/jwt/AccessTokenCodec";
import { SessionCookies } from "@/presentation/http/SessionCookies";

/**
 * Primera barrera de seguridad, antes de que la petición llegue a la página o a la API:
 *  1. Rechaza peticiones que modifican datos (POST/PUT/DELETE) si vienen de otro origen (CSRF).
 *  2. Exige un JWT válido para /admin y /api/admin.
 *     - API: responde 401 para que el cliente renueve la sesión.
 *     - Páginas: intenta renovar con el refresh token; si no hay, envía al login.
 * La autorización por rol se vuelve a comprobar en cada caso de uso (defensa en profundidad).
 */
const codec = new AccessTokenCodec({
  secret: process.env.JWT_ACCESS_SECRET ?? "",
  issuer: process.env.JWT_ISSUER ?? "perfumeria-prestige",
  audience: process.env.JWT_AUDIENCE ?? "prestige-admin",
  ttlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
});

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Una petición es del mismo origen si el header Origin coincide con el host por el que llegó
 * (localhost, la IP de la red local en desarrollo o el dominio público detrás de un balanceador).
 * Un sitio ajeno no puede hacer que el navegador envíe como Origin el host de esta app, así que la comprobación es válida.
 */
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  if (origin === request.nextUrl.origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return origin === `${proto}://${host}`;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") && MUTATING.has(request.method) && !isSameOrigin(request)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Origen no permitido." } }, { status: 403 });
  }

  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminPage = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  if (!isAdminApi && !isAdminPage) return NextResponse.next();

  const token = request.cookies.get(SessionCookies.ACCESS)?.value;
  const claims = token ? await codec.verify(token) : null;
  if (claims) return NextResponse.next();

  if (isAdminApi) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Tu sesión expiró. Inicia sesión de nuevo." } }, { status: 401 });
  }
  const refresh = new URL("/api/auth/refresh", request.url);
  refresh.searchParams.set("next", pathname);
  return NextResponse.redirect(refresh);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
