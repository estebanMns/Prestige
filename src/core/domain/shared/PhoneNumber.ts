import { ValidationError } from "./DomainError";

/**
 * Número de teléfono en formato internacional solo con dígitos (ej. 573001234567).
 * Si recibe un celular colombiano de 10 dígitos que empieza por 3, le antepone el indicativo 57.
 */
export class PhoneNumber {
  private constructor(readonly digits: string) {}

  static create(raw: string, field = "phone"): PhoneNumber {
    let digits = raw.replace(/\D/g, "");
    if (digits.length === 10 && digits.startsWith("3")) digits = `57${digits}`;
    if (digits.length < 10 || digits.length > 15) {
      throw new ValidationError("El número de teléfono no es válido. Ejemplo: 300 123 4567.", field);
    }
    return new PhoneNumber(digits);
  }

  /** Versión legible: +57 300 123 4567 */
  format(): string {
    const match = /^(57)(\d{3})(\d{3})(\d{4})$/.exec(this.digits);
    return match ? `+${match[1]} ${match[2]} ${match[3]} ${match[4]}` : `+${this.digits}`;
  }
}
