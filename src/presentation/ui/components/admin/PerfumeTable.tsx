"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PerfumeDTO } from "@/core/application/dto/PerfumeDTO";
import { PerfumeImage } from "../common/PerfumeImage";
import { useToast } from "../common/Toast";
import { ApiError, api } from "../../lib/ApiClient";

/** Lista del inventario con edición y borrado (con confirmación en la misma fila). */
export function PerfumeTable({ perfumes, canDelete }: { perfumes: PerfumeDTO[]; canDelete: boolean }) {
  const router = useRouter();
  const toast = useToast((s) => s.show);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const remove = async (perfume: PerfumeDTO) => {
    if (confirming !== perfume.id) {
      setConfirming(perfume.id);
      return;
    }
    setDeleting(perfume.id);
    try {
      await api.delete(`/api/admin/perfumes/${perfume.id}`);
      toast(`Eliminado: ${perfume.name}`);
      router.refresh();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "No se pudo eliminar.");
    } finally {
      setDeleting(null);
      setConfirming(null);
    }
  };

  if (perfumes.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-[var(--line-strong)] p-12 text-center text-muted">
        <h2 className="mb-1 text-2xl text-fg">Aún no hay perfumes</h2>
        Sube el primero con «Nuevo perfume».
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[14px] border border-line">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
            <th className="p-3 font-medium">Perfume</th>
            <th className="p-3 font-medium">Familia</th>
            <th className="p-3 font-medium">Presentaciones</th>
            <th className="p-3 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {perfumes.map((p) => (
            <tr key={p.id} className="border-b border-line last:border-b-0">
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <span className="media h-[62px] w-[52px] flex-none rounded-lg">
                    <PerfumeImage imageUrl={p.imageUrl} color={p.color} alt={p.name} illustrationClass="w-[60%]" />
                  </span>
                  <span className="min-w-0">
                    <b className="block font-display text-[17px] font-normal">
                      {p.name} {p.featured && <span className="tag tag-accent ml-1 align-middle">Destacado</span>}
                    </b>
                    <span className="text-xs text-muted">{p.house}</span>
                  </span>
                </div>
              </td>
              <td className="p-3 text-muted">
                {p.categoryLabel} · {p.genderLabel}
              </td>
              <td className="mono p-3 text-xs">
                {p.presentations.map((v) => (
                  <div key={`${v.ml}-${v.type}`} className={v.inStock ? "" : "text-muted line-through"}>
                    {v.ml} ml {v.typeLabel} · {v.priceLabel}
                  </div>
                ))}
              </td>
              <td className="p-3">
                <div className="flex justify-end gap-2">
                  <Link href={`/admin/perfumes/${p.id}`} className="btn btn-ghost btn-sm">
                    Editar
                  </Link>
                  {canDelete && (
                    <button type="button" className="btn btn-danger btn-sm" disabled={deleting === p.id} onClick={() => remove(p)} onBlur={() => setConfirming(null)}>
                      {confirming === p.id ? "¿Eliminar? Toca otra vez" : "Eliminar"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
