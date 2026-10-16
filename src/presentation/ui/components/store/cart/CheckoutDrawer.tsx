"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { PlacedOrderDTO } from "@/core/application/use-cases/orders/PlaceOrderUseCase";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS, type PaymentMethod } from "@/core/domain/order/Order";
import { Drawer } from "../../common/Drawer";
import { WhatsAppIcon } from "../../common/Icons";
import { useToast } from "../../common/Toast";
import { ApiError, api } from "../../../lib/ApiClient";
import { formatCop } from "../../../lib/format";
import { cartCount, cartTotal, useCart } from "../../../state/cartStore";
import { useUi } from "../../../state/uiStore";

interface CustomerForm {
  name: string;
  phone: string;
  documentId: string;
  city: string;
  address: string;
  neighborhood: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

const EMPTY: CustomerForm = { name: "", phone: "", documentId: "", city: "", address: "", neighborhood: "", paymentMethod: "TRANSFERENCIA", notes: "" };
const STORAGE_KEY = "prestige.customer";

/** Paso 1: datos de entrega y pago. Paso 2: resumen y envío del pedido por WhatsApp. */
export function CheckoutDrawer() {
  const { lines, clear } = useCart();
  const close = useUi((s) => s.close);
  const toast = useToast((s) => s.show);
  const [form, setForm] = useState<CustomerForm>(EMPTY);
  const [order, setOrder] = useState<PlacedOrderDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<CustomerForm> | null;
      if (saved) setForm((f) => ({ ...f, ...saved, paymentMethod: PAYMENT_METHODS.includes(saved.paymentMethod as PaymentMethod) ? (saved.paymentMethod as PaymentMethod) : "TRANSFERENCIA", notes: "" }));
    } catch {
      /* sin datos guardados */
    }
  }, []);

  const update = (patch: Partial<CustomerForm>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSending(true);
    try {
      const { notes, paymentMethod, ...customer } = form;
      const placed = await api.post<PlacedOrderDTO>("/api/orders", {
        items: lines.map((l) => ({ perfumeId: l.perfumeId, ml: l.ml, type: l.type, quantity: l.quantity })),
        customer,
        paymentMethod,
        notes,
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...customer, paymentMethod }));
      } catch {
        /* almacenamiento bloqueado */
      }
      setOrder(placed);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos preparar tu pedido. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const copy = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.message);
      toast("Mensaje copiado");
    } catch {
      toast("Selecciona el mensaje y cópialo");
    }
  };

  const finish = () => {
    clear();
    close();
    toast("¡Gracias por tu pedido!");
  };

  if (lines.length === 0 && !order) {
    return (
      <Drawer title="Finalizar compra" onClose={close}>
        <p className="text-muted">Tu carrito está vacío.</p>
      </Drawer>
    );
  }

  if (order) {
    return (
      <Drawer
        eyebrow="Finalizar compra"
        title="Revisa y envía"
        onClose={close}
        footer={
          <>
            <a className="btn border-[#25d366] bg-[#25d366] text-[#08240f] hover:bg-[#2fe074]" href={order.whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => setSent(true)}>
              <WhatsAppIcon width={18} height={18} /> Enviar pedido por WhatsApp
            </a>
            <div className="flex gap-2.5">
              <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={() => setOrder(null)}>
                Editar datos
              </button>
              <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={copy}>
                Copiar mensaje
              </button>
            </div>
            {sent && (
              <p className="m-0 rounded-xl border border-[var(--line-strong)] bg-[rgba(var(--accent-rgb),.07)] p-3 text-sm">
                ¿Ya enviaste el mensaje?{" "}
                <button type="button" className="text-accent underline" onClick={finish}>
                  Vaciar el carrito
                </button>
              </p>
            )}
          </>
        }
      >
        <p className="mono mb-4 text-xs text-muted">Pedido N.º {order.reference}</p>
        <div className="mb-4 flex items-baseline justify-between border-b border-line pb-3 text-lg">
          <span>Total a pagar</span>
          <span className="mono text-accent">{order.totalLabel}</span>
        </div>
        <div className="field mb-3">
          <span className="label">Mensaje que se enviará</span>
          <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-ink p-3.5 font-mono text-xs select-all">{order.message}</pre>
        </div>
        <p className="note">
          Se abrirá WhatsApp con el pedido listo{order.whatsappNumber ? " para nuestra línea de ventas" : ""}. Solo tienes que tocar enviar. Un asesor confirmará el envío y te indicará cómo pagar.
        </p>
      </Drawer>
    );
  }

  return (
    <Drawer
      eyebrow="Finalizar compra"
      title="Datos de entrega"
      onClose={close}
      footer={
        <>
          <div className="flex justify-between text-lg">
            <span>Total ({cartCount(lines)} productos)</span>
            <span className="mono text-accent">{formatCop(cartTotal(lines))}</span>
          </div>
          <button type="submit" form="checkout-form" className="btn" disabled={sending}>
            {sending ? "Preparando…" : "Confirmar dirección y pago"}
          </button>
        </>
      }
    >
      <form id="checkout-form" className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field id="co-name" label="Nombre completo" value={form.name} onChange={(name) => update({ name })} autoComplete="name" required />
          <Field id="co-phone" label="Celular" value={form.phone} onChange={(phone) => update({ phone })} autoComplete="tel" inputMode="tel" placeholder="300 123 4567" required />
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field id="co-doc" label="Cédula (opcional)" value={form.documentId} onChange={(documentId) => update({ documentId })} inputMode="numeric" />
          <Field id="co-city" label="Ciudad / municipio" value={form.city} onChange={(city) => update({ city })} autoComplete="address-level2" required />
        </div>
        <Field id="co-address" label="Dirección" value={form.address} onChange={(address) => update({ address })} autoComplete="street-address" placeholder="Calle 18 # 25-40, apto 302" required />
        <Field id="co-hood" label="Barrio" value={form.neighborhood} onChange={(neighborhood) => update({ neighborhood })} />
        <fieldset className="field">
          <legend className="label mb-1.5">Método de pago</legend>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {PAYMENT_METHODS.map((m) => (
              <label key={m} className={`flex cursor-pointer gap-2.5 rounded-xl border p-3 text-sm ${form.paymentMethod === m ? "border-accent bg-[rgba(var(--accent-rgb),.08)]" : "border-[var(--line-strong)]"}`}>
                <input type="radio" name="pay" value={m} checked={form.paymentMethod === m} onChange={() => update({ paymentMethod: m })} className="accent-[var(--accent)]" />
                {PAYMENT_METHOD_LABELS[m]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="field">
          <label htmlFor="co-notes">Notas para el asesor (opcional)</label>
          <textarea id="co-notes" className="input" value={form.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Horario de entrega, es un regalo, etc." maxLength={500} />
        </div>
        {error && <p className="error-text" role="alert">{error}</p>}
      </form>
    </Drawer>
  );
}

function Field(props: { id: string; label: string; value: string; onChange(v: string): void; required?: boolean; autoComplete?: string; inputMode?: "tel" | "numeric"; placeholder?: string }) {
  return (
    <div className="field">
      <label htmlFor={props.id}>{props.label}</label>
      <input
        id={props.id}
        className="input"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        placeholder={props.placeholder}
      />
    </div>
  );
}
