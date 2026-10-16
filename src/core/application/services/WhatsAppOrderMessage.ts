import { PAYMENT_METHOD_LABELS, type Order } from "../../domain/order/Order";
import { PRODUCT_TYPE_LABELS } from "../../domain/perfume/PerfumeEnums";

/** Construye el texto del pedido y el enlace de WhatsApp. Solo formatea; no valida ni calcula reglas. */
export class WhatsAppOrderMessage {
  constructor(private readonly storeName: string) {}

  text(order: Order): string {
    const c = order.customer;
    const lines = order.lines.map(
      (l) =>
        `• ${l.quantity} × ${l.perfumeName} (${l.house}) · ${l.ml} ml · ${PRODUCT_TYPE_LABELS[l.type]} — ${order.lineTotal(l).format()}`,
    );
    return [
      `*NUEVO PEDIDO · ${this.storeName.toUpperCase()}*`,
      `Pedido N.º ${order.reference}`,
      "",
      `*Cliente:* ${c.name}`,
      `*Celular:* ${c.phone.format()}`,
      c.documentId ? `*Cédula:* ${c.documentId}` : null,
      `*Dirección:* ${c.address}${c.neighborhood ? `, barrio ${c.neighborhood}` : ""}, ${c.city}`,
      `*Pago:* ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`,
      "",
      "*Productos:*",
      ...lines,
      "",
      `Subtotal: ${order.total().format()}`,
      "Envío: por confirmar con el asesor",
      `*TOTAL: ${order.total().format()}*`,
      order.notes ? `\nNotas: ${order.notes}` : null,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");
  }

  url(order: Order, whatsappNumber: string): string {
    const base = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "https://wa.me/";
    return `${base}?text=${encodeURIComponent(this.text(order))}`;
  }
}
