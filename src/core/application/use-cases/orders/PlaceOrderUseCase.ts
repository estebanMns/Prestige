import { Order, type OrderLine } from "../../../domain/order/Order";
import { PRODUCT_TYPES } from "../../../domain/perfume/PerfumeEnums";
import { ValidationError } from "../../../domain/shared/DomainError";
import { Guard } from "../../../domain/shared/Guard";
import { PhoneNumber } from "../../../domain/shared/PhoneNumber";
import type { PerfumeRepository, StoreSettingsRepository } from "../../ports/repositories";
import type { IdGenerator } from "../../ports/services";
import type { UseCase } from "../../ports/UseCase";
import type { WhatsAppOrderMessage } from "../../services/WhatsAppOrderMessage";

export interface PlaceOrderInput {
  items: { perfumeId: string; ml: number; type: string; quantity: number }[];
  customer: { name: string; phone: string; documentId: string; city: string; address: string; neighborhood: string };
  paymentMethod: string;
  notes: string;
}

export interface PlacedOrderDTO {
  reference: string;
  totalCop: number;
  totalLabel: string;
  message: string;
  whatsappUrl: string;
  whatsappNumber: string;
}

/**
 * Arma el pedido con los precios vigentes del catálogo (lo que envía el navegador solo indica
 * qué producto y cuántas unidades) y devuelve el mensaje listo para WhatsApp.
 */
export class PlaceOrderUseCase implements UseCase<PlaceOrderInput, PlacedOrderDTO> {
  constructor(
    private readonly perfumes: PerfumeRepository,
    private readonly settings: StoreSettingsRepository,
    private readonly ids: IdGenerator,
    private readonly message: WhatsAppOrderMessage,
  ) {}

  async execute(input: PlaceOrderInput): Promise<PlacedOrderDTO> {
    if (input.items.length === 0) throw new ValidationError("Tu carrito está vacío.", "items");
    const catalog = await this.perfumes.findByIds([...new Set(input.items.map((i) => i.perfumeId))]);
    const byId = new Map(catalog.map((p) => [p.id, p]));

    const lines: OrderLine[] = input.items.map((item) => {
      const perfume = byId.get(item.perfumeId);
      if (!perfume) throw new ValidationError("Uno de los perfumes de tu carrito ya no está disponible.", "items");
      const type = Guard.oneOf(item.type, PRODUCT_TYPES, "type", "El tipo");
      const presentation = perfume.findPresentation(item.ml, type);
      if (!presentation || !presentation.inStock) {
        throw new ValidationError(`${perfume.name} de ${item.ml} ml ya no está disponible.`, "items");
      }
      return { perfumeName: perfume.name, house: perfume.house, ml: presentation.ml, type, unitPrice: presentation.price, quantity: item.quantity };
    });

    const order = Order.place({
      reference: `PP-${this.ids.shortCode(6)}`,
      customer: {
        name: input.customer.name,
        phone: PhoneNumber.create(input.customer.phone),
        documentId: input.customer.documentId.trim(),
        city: input.customer.city,
        address: input.customer.address,
        neighborhood: input.customer.neighborhood.trim(),
      },
      lines,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
    });

    const { whatsapp } = await this.settings.get();
    return {
      reference: order.reference,
      totalCop: order.total().amount,
      totalLabel: order.total().format(),
      message: this.message.text(order),
      whatsappUrl: this.message.url(order, whatsapp),
      whatsappNumber: whatsapp,
    };
  }
}
