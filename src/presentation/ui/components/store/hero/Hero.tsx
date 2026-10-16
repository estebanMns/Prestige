"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ArrowIcon } from "../../common/Icons";
import { BottleIllustration } from "../../common/BottleIllustration";
import { useUi } from "../../../state/uiStore";
import { ESSENCES, type Essence } from "./essences";

/** El 3D se carga solo en el navegador y después de lo esencial de la página. */
const Bottle3D = dynamic(() => import("./Bottle3D"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center">
      <BottleIllustration color="#a82848" className="w-[40%] opacity-70" />
    </div>
  ),
});

export function Hero({ perfumeCount }: { perfumeCount: number }) {
  const [essence, setEssence] = useState<Essence>(ESSENCES[0]!);
  const [modelFailed, setModelFailed] = useState(false);
  const openChat = useUi((s) => s.open);

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_72%_45%,rgba(var(--accent-rgb),.16),transparent_70%)]" />
      <div className="wrap relative grid items-center gap-5 py-9 md:grid-cols-[1.05fr_1fr] md:py-14">
        <div className="reveal min-w-0">
          <div className="eyebrow">Alta perfumería · Nicho · Diseñador · Árabe</div>
          <h1 className="my-5 text-[clamp(44px,6.6vw,92px)] leading-[0.96]">
            El arte de <em className="text-accent">dejar huella</em>
          </h1>
          <p className="mb-7 max-w-[46ch] text-[17px] text-muted">
            Fragancias originales y versiones 1.1 seleccionadas una a una. Encuentra tu firma olfativa, pídela en minutos y recíbela con la asesoría de nuestro equipo por WhatsApp.
          </p>
          <div className="flex flex-wrap gap-3">
            <a className="btn" href="#coleccion">
              Explorar la colección <ArrowIcon width={16} height={16} />
            </a>
            <button type="button" className="btn btn-ghost" onClick={() => openChat("chat")}>
              Pregúntale al asesor
            </button>
          </div>
          <dl className="mt-10 flex flex-wrap gap-8 border-t border-line pt-6">
            {[
              [String(perfumeCount || "—"), "Fragancias en catálogo"],
              ["3", "Familias de casas"],
              ["50 · 100", "Mililitros disponibles"],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-col">
                <dt className="order-2 text-xs tracking-wide text-muted">{label}</dt>
                <dd className="font-display text-[30px]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="reveal relative order-first mx-auto aspect-[1/1.05] w-full max-w-[440px] md:order-none md:max-w-none" style={{ animationDelay: ".15s" }}>
          <div className="absolute inset-[8%_6%] rounded-full border border-line" />
          <div className="absolute inset-[16%_14%] animate-[spin_60s_linear_infinite] rounded-full border border-dashed border-line opacity-50" />
          <div className="absolute inset-0 cursor-grab active:cursor-grabbing" aria-label="Frasco de perfume en 3D. Arrastra para girarlo.">
            {modelFailed ? (
              <div className="grid h-full place-items-center">
                <BottleIllustration color="#a82848" className="w-[40%] opacity-70" />
              </div>
            ) : (
              <Bottle3D essence={essence} onError={() => setModelFailed(true)} />
            )}
          </div>
          <span className="absolute right-[4%] top-[6%] font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted">Arrastra para girar</span>
          <div className="absolute bottom-[4%] left-1/2 flex -translate-x-1/2 gap-2 rounded-full border border-line bg-[rgba(var(--ink-rgb),.75)] p-1.5 backdrop-blur" role="group" aria-label="Esencia del frasco">
            {ESSENCES.map((e) => (
              <button
                key={e.id}
                type="button"
                aria-pressed={e.id === essence.id}
                onClick={() => setEssence(e)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${e.id === essence.id ? "bg-ink-3 text-fg" : "text-muted"}`}
              >
                <i className="block h-2.5 w-2.5 rounded-full" style={{ background: e.liquid }} />
                {e.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
