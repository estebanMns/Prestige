import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Permission } from "@/core/domain/user/Role";
import { container } from "@/infrastructure/di/Container";
import { AdminNav } from "@/presentation/ui/components/admin/AdminNav";
import { LogoutButton } from "@/presentation/ui/components/admin/LogoutButton";
import { ThemeToggle } from "@/presentation/ui/components/theme/ThemeToggle";
import { Toast } from "@/presentation/ui/components/common/Toast";
import { requireActor } from "@/presentation/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };

/**
 * Marco del panel. El middleware ya exigió un JWT válido; aquí se vuelve a verificar
 * (defensa en profundidad) y se cargan los datos del usuario para mostrar su rol.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  const user = await container().currentUser.execute({ actor }).catch(() => null);
  if (!user) redirect("/admin/login");

  const links = [
    { href: "/admin", label: "Inventario" },
    { href: "/admin/perfumes/nuevo", label: "Nuevo perfume" },
    ...(user.permissions.includes(Permission.SettingsUpdate) ? [{ href: "/admin/ajustes", label: "Datos de la tienda" }] : []),
    { href: "/admin/seguridad", label: "Seguridad" },
  ];

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[250px_1fr]">
      <aside className="flex flex-col gap-6 border-b border-line bg-ink-2 p-5 md:sticky md:top-0 md:h-dvh md:border-b-0 md:border-r">
        <Link className="logo" href="/admin">
          <b className="!text-[22px]">PRESTIGE</b>
          <span>PANEL</span>
        </Link>
        <AdminNav links={links} />
        <div className="mt-auto grid gap-3 border-t border-line pt-4 text-sm">
          <div>
            <div className="truncate text-fg">{user.email}</div>
            <div className="note">
              {user.roleLabel}
              {user.totpEnabled ? " · 2FA activo" : " · 2FA pendiente"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="btn btn-ghost btn-sm" target="_blank">
              Ver tienda
            </Link>
            <LogoutButton />
          </div>
        </div>
      </aside>
      <main className="min-w-0 p-5 md:p-10">{children}</main>
      <Toast />
    </div>
  );
}
