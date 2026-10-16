import { ValidationError } from "./DomainError";

/** Validaciones reutilizables que lanzan ValidationError con un mensaje claro para el usuario. */
export class Guard {
  static nonEmpty(value: string, field: string, label: string): string {
    const trimmed = value.trim();
    if (!trimmed) throw new ValidationError(`${label} es obligatorio.`, field);
    return trimmed;
  }

  static maxLength(value: string, max: number, field: string, label: string): string {
    if (value.length > max) throw new ValidationError(`${label} no puede superar ${max} caracteres.`, field);
    return value;
  }

  static positiveInteger(value: number, field: string, label: string): number {
    if (!Number.isInteger(value) || value <= 0) {
      throw new ValidationError(`${label} debe ser un número entero mayor que cero.`, field);
    }
    return value;
  }

  static oneOf<T extends string>(value: string, allowed: readonly T[], field: string, label: string): T {
    if (!(allowed as readonly string[]).includes(value)) {
      throw new ValidationError(`${label} no es válido.`, field);
    }
    return value as T;
  }
}
