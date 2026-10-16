import { Permission, RolePolicy } from "@/core/domain/user/Role";
import { container } from "@/infrastructure/di/Container";
import { SecurityPanel } from "@/presentation/ui/components/admin/SecurityPanel";
import { requireActor } from "@/presentation/server/session";

const ACTION_LABELS: Record<string, string> = {
  "perfume.created": "Creó un perfume",
  "perfume.updated": "Editó un perfume",
  "perfume.deleted": "Eliminó un perfume",
  "settings.updated": "Actualizó los datos de la tienda",
  "auth.login": "Inició sesión",
  "auth.login_failed": "Intento de acceso fallido",
  "auth.locked": "Cuenta bloqueada por intentos",
  "auth.token_reuse_detected": "Reutilización de sesión detectada",
  "auth.totp_enabled": "Activó la verificación en dos pasos",
  "auth.password_changed": "Cambió la contraseña",
};

export default async function SecurityPage() {
  const actor = await requireActor();
  const c = container();
  const user = await c.currentUser.execute({ actor });
  const canAudit = RolePolicy.allows(actor.role, Permission.AuditRead);
  const entries = canAudit ? await c.listAuditLog.execute({ actor, limit: 40 }) : [];
  const date = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });

  return (
    <>
      <div className="eyebrow">Cuenta</div>
      <h1 className="mb-8 mt-2 text-4xl">Seguridad</h1>
      <SecurityPanel totpEnabled={user.totpEnabled} />
      {canAudit && (
        <section className="mt-14 max-w-[900px]">
          <h2 className="mb-4 text-2xl">Registro de actividad</h2>
          <div className="overflow-x-auto rounded-[14px] border border-line">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                  <th className="p-3 font-medium">Fecha</th>
                  <th className="p-3 font-medium">Acción</th>
                  <th className="p-3 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i} className="border-b border-line last:border-b-0">
                    <td className="mono whitespace-nowrap p-3 text-xs text-muted">{date.format(e.at)}</td>
                    <td className={`p-3 ${e.action.includes("failed") || e.action.includes("locked") || e.action.includes("reuse") ? "text-bad" : ""}`}>{ACTION_LABELS[e.action] ?? e.action}</td>
                    <td className="p-3 text-muted">{typeof e.details?.name === "string" ? e.details.name : typeof e.details?.ip === "string" ? `IP ${e.details.ip}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
