import { ValidationError } from "./DomainError";

/**
 * Valor monetario en pesos colombianos. Se guarda en pesos enteros (el COP no usa centavos en la práctica),
 * lo que evita errores de redondeo con números de punto flotante.
 */
export class Money {
  private static readonly formatter = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

  private constructor(readonly amount: number) {}

  static cop(amount: number): Money {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new ValidationError("El precio debe ser un número entero de pesos, mayor o igual a cero.", "price");
    }
    return new Money(amount);
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  multiply(quantity: number): Money {
    if (!Number.isInteger(quantity) || quantity < 0) throw new ValidationError("La cantidad no es válida.", "quantity");
    return new Money(this.amount * quantity);
  }

  isLessThan(other: Money): boolean {
    return this.amount < other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  format(): string {
    return Money.formatter.format(this.amount).replace(/ /g, " ");
  }
}
