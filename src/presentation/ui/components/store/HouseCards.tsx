"use client";

import type { Gender, PerfumeCategory } from "@/core/domain/perfume/PerfumeEnums";
import { useUi } from "../../state/uiStore";

const HOUSES: { category: PerfumeCategory; kicker: string; title: string; text: string }[] = [
  { category: "NICHO", kicker: "Casas independientes", title: "Nicho", text: "Creed, Xerjoff, Kurkdjian, Tom Ford Private Blend. Materias primas raras y tirajes cortos." },
  { category: "DISENADOR", kicker: "Grandes maisons", title: "Diseñador", text: "Dior, Chanel, YSL, Carolina Herrera. Los clásicos que todos reconocen al pasar." },
  { category: "ARABE", kicker: "Oriente Medio", title: "Árabes", text: "Lattafa, Armaf, Afnan. Oud, especias y dulzor de larga duración a precios amables." },
];

/** Accesos a las tres familias, cada uno con atajos a hombre y mujer. */
export function HouseCards() {
  const setFilter = useUi((s) => s.setFilter);
  const go = (category: PerfumeCategory, gender: Gender | "") => {
    setFilter({ category, gender });
    document.getElementById("coleccion")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="wrap py-20" id="familias">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow">Nuestras familias</div>
          <h2 className="mt-3 text-[clamp(34px,4.4vw,56px)] leading-[1.02]">
            Tres maneras de <em className="text-accent">perfumarse</em>
          </h2>
        </div>
        <p className="max-w-[44ch] text-muted">Elige una familia y luego si es para él o para ella. Las fragancias unisex aparecen en ambos lados.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {HOUSES.map((h) => (
          <div key={h.category} className="flex min-h-[230px] flex-col rounded-[14px] border border-line bg-ink-2 p-7 transition hover:-translate-y-1 hover:border-accent">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">{h.kicker}</span>
            <button type="button" onClick={() => go(h.category, "")} className="mt-auto text-left font-display text-[38px] italic text-fg">
              {h.title}
            </button>
            <p className="mb-4 max-w-[34ch] text-sm text-muted">{h.text}</p>
            <div className="flex gap-2">
              {(["HOMBRE", "MUJER"] as const).map((g) => (
                <button key={g} type="button" onClick={() => go(h.category, g)} className="rounded-full border border-[var(--line-strong)] px-3 py-1 text-xs text-fg transition hover:border-accent hover:bg-accent hover:text-on-accent">
                  {g === "HOMBRE" ? "Hombre" : "Mujer"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
