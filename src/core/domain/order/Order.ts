import { ValidationError } from "../shared/DomainError";
import { Guard } from "../shared/Guard";
import { Money } from "../shared/Money";
import type { PhoneNumber } from "../shared/PhoneNumber";
import type { ProductType } from "../perfume/PerfumeEnums";

export const PAYMENT_METHODS = ["TRANSFERENCIA", "NEQUI_DAVIPLATA"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  TRANSFERENCIA: "Transferencia bancaria",
  NEQUI_DAVIPLATA: "Nequi / Daviplata",
};

export interface OrderLine {
  perfumeName: string;
  house: string;
  ml: number;
  type: ProductType;
  unitPrice: Money;
  quantity: number;
}

export interface Customer {
  name: string;
  phone: PhoneNumber;
  documentId: string;
  city: string;
  address: string;
  neighborhood: string;
}

/**
 * Pedido armado por el cliente. No se persiste: se convierte en un mensaje de WhatsApp
 * que recibe un asesor. Los precios de cada línea vienen del catálogo, nunca del navegador.
 */
export class Order {
  static readonly MAX_QUANTITY_PER_LINE = 20;

  private constructor(
    readonly reference: string,
    readonly customer: Customer,
    readonly lines: readonly OrderLine[],
    readonly paymentMethod: PaymentMethod,
    readonly notes: string,
  ) {}

  static place(input: {
    reference: string;
    customer: Customer;
    lines: OrderLine[];
    paymentMethod: string;
    notes: string;
  }): Order {
    if (input.lines.length === 0) throw new ValidationError("El pedido no tiene productos.", "lines");
    for (const line of input.lines) {
      Guard.positiveInteger(line.quantity, "quantity", "La cantidad");
      if (line.quantity > Order.MAX_QUANTITY_PER_LINE) {
        throw new ValidationError(`Máximo ${Order.MAX_QUANTITY_PER_LINE} unidades por producto.`, "quantity");
      }
    }
    const customer: Customer = {
      ...input.customer,
      name: Guard.nonEmpty(input.customer.name, "name", "El nombre"),
      city: Guard.nonEmpty(input.customer.city, "city", "La ciudad"),
      address: Guard.nonEmpty(input.customer.address, "address", "La dirección"),
    };
    return new Order(
      input.reference,
      customer,
      input.lines,
      Guard.oneOf(input.paymentMethod, PAYMENT_METHODS, "paymentMethod", "El método de pago"),
      input.notes.trim().slice(0, 500),
    );
  }

  lineTotal(line: OrderLine): Money {
    return line.unitPrice.multiply(line.quantity);
  }

  total(): Money {
    return this.lines.reduce((sum, line) => sum.add(this.lineTotal(line)), Money.zero());
  }

  itemCount(): number {
    return this.lines.reduce((n, line) => n + line.quantity, 0);
  }
}
