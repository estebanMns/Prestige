import { ValidationError } from "./DomainError";

export class Email {
  private static readonly pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  private constructor(readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!Email.pattern.test(normalized) || normalized.length > 254) {
      throw new ValidationError("El correo no es válido.", "email");
    }
    return new Email(normalized);
  }

  toString(): string {
    return this.value;
  }
}
