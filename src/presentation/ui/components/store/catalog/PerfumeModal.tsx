"use client";

import { useEffect, useMemo, useState } from "react";
import type { PerfumeDTO } from "@/core/application/dto/PerfumeDTO";
import { CloseIcon } from "../../common/Icons";
import { PerfumeImage, glowFor } from "../../common/PerfumeImage";
import { useToast } from "../../common/Toast";
import { formatCop } from "../../../lib/format";
import { useCart } from "../../../state/cartStore";
import { useUi } from "../../../state/uiStore";

/** Ficha del perfume: notas olfativas, elección de presentación y cantidad. */
export function PerfumeModal({ perfumes }: { perfumes: PerfumeDTO[] }) {
  const { selectedPerfumeId, showPerfume, open } = useUi();
  const add = useCart((s) => s.add);
  const toast = useToast((s) => s.show);
  const perfume = useMemo(() => perfumes.find((p) => p.id === selectedPerfumeId) ?? null, [perfumes, selectedPerfumeId]);
  const [selected, setSelected] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelected(Math.max(0, perfume?.presentations.findIndex((p) => p.inStock) ?? 0));
    setQuantity(1);
  }, [perfume]);

  useEffect(() => {
    if (!perfume) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && showPerfume(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [perfume, showPerfume]);

  if (!perfume) return null;
  const presentation = perfume.presentations[selected];
  const close = () => showPerfume(null);
  const addToCart = (checkout: boolean) => {
    if (!presentation || !presentation.inStock) return;
    add(perfume, presentation, quantity);
    close();
    if (checkout) open("checkout");
    else toast(`Agregado: ${perfume.name} · ${presentation.ml} ml`);
  };

  return (
    <>
      <div className="scrim" onClick={close} />
      <div className="pointer-events-none fixed inset-0 z-[61] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={perfume.name}>
        <div className="modal-card pointer-events-auto grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" style={{ ["--glow" as string]: glowFor(perfume.color) }}>
          <button type="button" className="icon-btn absolute right-3.5 top-3.5 z-10 bg-[rgba(var(--ink-rgb),.7)]" onClick={close} aria-label="Cerrar">
            <CloseIcon />
          </button>
          <div className="media relative min-h-[300px] md:min-h-full">
            <PerfumeImage imageUrl={perfume.imageUrl} color={perfume.color} alt={perfume.name} illustrationClass="w-[42%]" fill />
          </div>
          <div className="flex min-w-0 flex-col gap-4 break-words p-6 md:p-8">
            <div className="eyebrow">
              {perfume.house} · {perfume.categoryLabel} · {perfume.genderLabel}
            </div>
            <h2 className="text-[clamp(32px,4vw,46px)] leading-[1.02]">{perfume.name}</h2>
            <span className="mono text-xs tracking-wide text-muted">{perfume.concentrationLabel}</span>
            {perfume.description && <p className="m-0 text-muted">{perfume.description}</p>}
            <dl className="grid gap-2">
              {(
                [
                  ["Salida", perfume.notes.top],
                  ["Corazón", perfume.notes.heart],
                  ["Fondo", perfume.notes.base],
                ] as const
              )
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[86px_1fr] items-baseline gap-3 text-sm">
                    <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent">{label}</dt>
                    <dd className="m-0">{value}</dd>
                  </div>
                ))}
            </dl>
            <div>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">Presentación</span>
              <div className="mt-2 flex flex-wrap gap-2.5">
                {perfume.presentations.map((p, i) => (
                  <button
                    key={`${p.ml}-${p.type}`}
                    type="button"
                    disabled={!p.inStock}
                    aria-pressed={i === selected}
                    onClick={() => setSelected(i)}
                    className={`min-w-[120px] rounded-xl border px-3.5 py-2.5 text-left transition disabled:opacity-40 ${i === selected ? "border-accent bg-[rgba(var(--accent-rgb),.1)]" : "border-[var(--line-strong)]"}`}
                  >
                    <b className={`mono block text-[15px] font-medium ${i === selected ? "text-accent" : ""}`}>{p.ml} ml</b>
                    <span className="text-[11.5px] text-muted">
                      {p.typeLabel} · {p.inStock ? p.priceLabel : "Agotado"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
              <span className="mono text-[28px] text-accent">{formatCop((presentation?.priceCop ?? 0) * quantity)}</span>
              <div className="inline-flex items-center rounded-full border border-[var(--line-strong)]">
                <button type="button" className="h-[38px] w-[38px] text-lg" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Menos">
                  −
                </button>
                <span className="mono min-w-7 text-center">{quantity}</span>
                <button type="button" className="h-[38px] w-[38px] text-lg" onClick={() => setQuantity((q) => Math.min(20, q + 1))} aria-label="Más">
                  +
                </button>
              </div>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <button type="button" className="btn" disabled={!presentation?.inStock} onClick={() => addToCart(false)}>
                Agregar al pedido
              </button>
              <button type="button" className="btn btn-ghost" disabled={!presentation?.inStock} onClick={() => addToCart(true)}>
                Comprar ahora
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
