import Link from "next/link";
import { Permission } from "@/core/domain/user/Role";
import { RolePolicy } from "@/core/domain/user/Role";
import { container } from "@/infrastructure/di/Container";
import { PerfumeTable } from "@/presentation/ui/components/admin/PerfumeTable";
import { requireActor } from "@/presentation/server/session";

export default async function InventoryPage() {
  const actor = await requireActor();
  const perfumes = await container().listPerfumes.execute({});
  const count = (category: string) => perfumes.filter((p) => p.category === category).length;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Inventario</div>
          <h1 className="mt-2 text-4xl">Perfumes publicados</h1>
          <p className="mono mt-2 text-xs text-muted">
            {perfumes.length} en total · Nicho {count("NICHO")} · Diseñador {count("DISENADOR")} · Árabes {count("ARABE")}
          </p>
        </div>
        <Link href="/admin/perfumes/nuevo" className="btn">
          + Nuevo perfume
        </Link>
      </div>
      <PerfumeTable perfumes={perfumes} canDelete={RolePolicy.allows(actor.role, Permission.PerfumeDelete)} />
    </>
  );
}
