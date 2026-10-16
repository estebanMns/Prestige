"use client";

import { useMemo } from "react";
import type { PerfumeDTO } from "@/core/application/dto/PerfumeDTO";
import type { Gender, PerfumeCategory, ProductType } from "@/core/domain/perfume/PerfumeEnums";
import { SearchIcon } from "../../common/Icons";
import { useUi } from "../../../state/uiStore";
import { CatalogFilterService } from "./CatalogFilterService";
import { PerfumeCard } from "./PerfumeCard";

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T | ""; options: [T | "", string][]; onChange(v: T | ""): void }) {
  return (
    <>
      <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted">{label}</span>
      <div className="seg" role="group" aria-label={label}>
        {options.map(([v, text]) => (
          <button key={text} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </>
  );
}

export function Catalog({ perfumes }: { perfumes: PerfumeDTO[] }) {
  const { filter, setFilter, showPerfume } = useUi();
  const visible = useMemo(() => CatalogFilterService.apply(perfumes, filter), [perfumes, filter]);

  return (
    <section className="wrap pb-16 pt-5" id="coleccion">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow">Colección</div>
          <h2 className="mt-3 text-[clamp(34px,4.4vw,56px)] leading-[1.02]">{CatalogFilterService.title(filter)}</h2>
        </div>
        <p className="max-w-[44ch] text-muted">Toca un perfume para ver sus notas, elegir los mililitros y agregarlo al pedido.</p>
      </div>

      <div className="mb-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-line py-4">
        <Segmented<PerfumeCategory>
          label="Familia"
          value={filter.category}
          onChange={(category) => setFilter({ category })}
          options={[["", "Todas"], ["NICHO", "Nicho"], ["DISENADOR", "Diseñador"], ["ARABE", "Árabes"]]}
        />
        <Segmented<Gender> label="Para" value={filter.gender} onChange={(gender) => setFilter({ gender })} options={[["", "Todos"], ["HOMBRE", "Hombre"], ["MUJER", "Mujer"]]} />
        <Segmented<ProductType> label="Tipo" value={filter.type} onChange={(type) => setFilter({ type })} options={[["", "Todos"], ["ORIGINAL", "Original"], ["REPLICA_1_1", "1.1"]]} />
        <label className="flex min-w-0 flex-[1_1_220px] items-center gap-2.5 border-b border-[var(--line-strong)] px-0.5 py-1.5">
          <SearchIcon width={16} height={16} className="text-muted" />
          <input
            type="search"
            value={filter.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            placeholder="Buscar por nombre, casa o nota (vainilla, oud…)"
            aria-label="Buscar perfume"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
      </div>

      <p className="mb-5 font-mono text-[11.5px] tracking-wide text-muted">
        {visible.length} {visible.length === 1 ? "fragancia" : "fragancias"}
      </p>

      {perfumes.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--line-strong)] px-6 py-12 text-center text-muted">
          <h3 className="mb-1 text-[28px] text-fg">La vitrina está vacía</h3>
          Aún no hay perfumes publicados. Vuelve pronto.
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--line-strong)] px-6 py-12 text-center text-muted">
          <h3 className="mb-1 text-[28px] text-fg">Sin resultados</h3>
          Prueba otra familia o quita algún filtro.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[22px]">
          {visible.map((p, i) => (
            <PerfumeCard key={p.id} perfume={p} index={i} onOpen={showPerfume} />
          ))}
        </div>
      )}
    </section>
  );
}
