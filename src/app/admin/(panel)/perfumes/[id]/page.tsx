import { notFound } from "next/navigation";
import { NotFoundError } from "@/core/domain/shared/DomainError";
import { container } from "@/infrastructure/di/Container";
import { PerfumeForm } from "@/presentation/ui/components/admin/PerfumeForm";

export default async function EditPerfumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const perfume = await container()
    .getPerfume.execute({ id })
    .catch((e: unknown) => {
      if (e instanceof NotFoundError) notFound();
      throw e;
    });

  return (
    <>
      <div className="eyebrow">Inventario</div>
      <h1 className="mb-8 mt-2 text-4xl">Editar {perfume.name}</h1>
      <PerfumeForm perfume={perfume} />
    </>
  );
}
