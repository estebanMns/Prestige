import { redirect } from "next/navigation";
import { Permission, RolePolicy } from "@/core/domain/user/Role";
import { container } from "@/infrastructure/di/Container";
import { SettingsForm } from "@/presentation/ui/components/admin/SettingsForm";
import { requireActor } from "@/presentation/server/session";

export default async function SettingsPage() {
  const actor = await requireActor();
  if (!RolePolicy.allows(actor.role, Permission.SettingsUpdate)) redirect("/admin");
  const settings = await container().getStoreSettings.execute();
  return (
    <>
      <div className="eyebrow">Tienda</div>
      <h1 className="mb-8 mt-2 text-4xl">Datos de la tienda</h1>
      <SettingsForm initial={settings} />
    </>
  );
}
