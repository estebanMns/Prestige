import { Guard } from "../shared/Guard";
import { Money } from "../shared/Money";
import { PRODUCT_TYPES, type ProductType } from "./PerfumeEnums";

export interface PresentationProps {
  ml: number;
  type: ProductType;
  price: Money;
  inStock: boolean;
}

/**
 * Value object: una forma concreta de vender un perfume (mililitros + tipo + precio).
 * Dos presentaciones con los mismos ml y tipo se consideran la misma.
 */
export class Presentation {
  private constructor(private readonly props: PresentationProps) {}

  static create(input: { ml: number; type: string; priceCop: number; inStock?: boolean }): Presentation {
    return new Presentation({
      ml: Guard.positiveInteger(input.ml, "ml", "Los mililitros"),
      type: Guard.oneOf(input.type, PRODUCT_TYPES, "type", "El tipo"),
      price: Money.cop(input.priceCop),
      inStock: input.inStock ?? true,
    });
  }

  get ml(): number {
    return this.props.ml;
  }
  get type(): ProductType {
    return this.props.type;
  }
  get price(): Money {
    return this.props.price;
  }
  get inStock(): boolean {
    return this.props.inStock;
  }

  /** Clave estable para identificar la presentación dentro de un perfume. */
  get key(): string {
    return `${this.props.ml}:${this.props.type}`;
  }

  sameVariantAs(other: Presentation): boolean {
    return this.key === other.key;
  }
}
