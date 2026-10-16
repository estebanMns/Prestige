import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Actor } from "@/core/domain/auth/Actor";
import { container } from "@/infrastructure/di/Container";
import { SessionCookies } from "../http/SessionCookies";

/** Lee y verifica el JWT de la cookie en componentes de servidor del panel. */
export async function currentActor(): Promise<Actor | null> {
  const token = (await cookies()).get(SessionCookies.ACCESS)?.value;
  if (!token) return null;
  const c = container();
  const claims = await c.accessTokenCodec.verify(token);
  if (!claims) return null;
  // El JWT por sí solo no basta: si se abrió otra sesión o se cerró esta, el token deja de valer.
  const active = await c.refreshTokenRepository.hasActiveFamily(claims.sessionId, c.clock.now());
  return active ? claims : null;
}

/** Igual que currentActor, pero redirige al login si no hay sesión válida. */
export async function requireActor(): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) redirect("/admin/login");
  return actor;
}
