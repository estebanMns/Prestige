"use client";

import { Drawer } from "../../common/Drawer";
import { ArrowIcon } from "../../common/Icons";
import { PerfumeImage } from "../../common/PerfumeImage";
import { formatCop } from "../../../lib/format";
import { cartTotal, useCart } from "../../../state/cartStore";
import { useUi } from "../../../state/uiStore";

export function CartDrawer() {
  const { lines, setQuantity, remove } = useCart();
  const { close, open } = useUi();
  const total = cartTotal(lines);

  const footer = lines.length ? (
    <>
      <dl className="grid gap-1.5 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="mono">{formatCop(total)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Envío</dt>
          <dd className="note">Lo confirma el asesor</dd>
        </div>
        <div className="mt-1 flex justify-between border-t border-line pt-2 text-lg">
          <dt>Total</dt>
          <dd className="mono text-accent">{formatCop(total)}</dd>
        </div>
      </dl>
      <button type="button" className="btn" onClick={() => open("checkout")}>
        Ir a pagar <ArrowIcon width={16} height={16} />
      </button>
    </>
  ) : (
    <a href="#coleccion" className="btn btn-ghost" onClick={close}>
      Ver la colección
    </a>
  );

  return (
    <Drawer title="Tu pedido" onClose={close} footer={footer}>
      {lines.length === 0 ? (
        <div className="mt-5 rounded-[14px] border border-dashed border-[var(--line-strong)] px-6 py-12 text-center text-muted">
          <h3 className="mb-1 text-[26px] text-fg">Aún no hay perfumes</h3>
          Explora la colección y elige tu presentación.
        </div>
      ) : (
        <ul className="m-0 list-none p-0">
          {lines.map((line) => (
            <li key={line.key} className="grid grid-cols-[64px_1fr_auto] items-center gap-3.5 border-b border-line py-3.5">
              <div className="media h-[76px] w-16 rounded-[10px]">
                <PerfumeImage imageUrl={line.imageUrl} color={line.color} alt={line.name} illustrationClass="w-[58%]" />
              </div>
              <div className="min-w-0">
                <h4 className="m-0 font-display text-lg leading-tight">{line.name}</h4>
                <small className="block text-xs text-muted">{line.house}</small>
                <small className="mono block text-xs text-muted">
                  {line.ml} ml · {line.typeLabel} · {formatCop(line.unitPriceCop)}
                </small>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="mono text-accent">{formatCop(line.unitPriceCop * line.quantity)}</span>
                <div className="inline-flex items-center rounded-full border border-[var(--line-strong)]">
                  <button type="button" className="h-[30px] w-[30px]" onClick={() => setQuantity(line.key, line.quantity - 1)} aria-label="Menos">
                    −
                  </button>
                  <span className="mono min-w-6 text-center">{line.quantity}</span>
                  <button type="button" className="h-[30px] w-[30px]" onClick={() => setQuantity(line.key, line.quantity + 1)} aria-label="Más">
                    +
                  </button>
                </div>
                <button type="button" className="text-xs text-muted underline hover:text-bad" onClick={() => remove(line.key)}>
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
