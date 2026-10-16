import type { PerfumeDTO } from "@/core/application/dto/PerfumeDTO";
import { PerfumeImage, glowFor } from "../../common/PerfumeImage";

export function PerfumeCard({ perfume, onOpen, index }: { perfume: PerfumeDTO; onOpen(id: string): void; index: number }) {
  const types = [...new Set(perfume.presentations.map((p) => p.typeLabel))];
  const mls = [...new Set(perfume.presentations.map((p) => p.ml))].sort((a, b) => a - b);

  return (
    <button type="button" className="card reveal" onClick={() => onOpen(perfume.id)} style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
      <div className="media aspect-[4/4.4]" style={{ ["--glow" as string]: glowFor(perfume.color) }}>
        <PerfumeImage imageUrl={perfume.imageUrl} color={perfume.color} alt={perfume.name} />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {perfume.featured && <span className="tag tag-accent">Destacado</span>}
          {types.map((t) => (
            <span key={t} className={`tag ${t === "1.1" ? "tag-second" : ""}`}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-[18px]">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted">{perfume.house}</span>
        <h3 className="text-[22px] leading-tight">{perfume.name}</h3>
        <span className="text-[12.5px] text-muted">
          {perfume.categoryLabel} · {perfume.genderLabel} · {perfume.concentrationLabel}
        </span>
        <div className="mt-auto flex items-baseline justify-between border-t border-line pt-3.5">
          <span className="mono text-[15px] text-accent">Desde {perfume.startingPriceLabel}</span>
          <span className="mono text-[11px] text-muted">{mls.join(" · ")} ml</span>
        </div>
      </div>
    </button>
  );
}
