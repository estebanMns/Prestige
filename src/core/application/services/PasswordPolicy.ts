import { ValidationError } from "../../domain/shared/DomainError";

/** Reglas mínimas para una contraseña del panel. */
export class PasswordPolicy {
  static readonly MIN_LENGTH = 12;

  static assertStrong(password: string): void {
    const ok =
      password.length >= PasswordPolicy.MIN_LENGTH &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password);
    if (!ok) {
      throw new ValidationError(
        `La contraseña necesita al menos ${PasswordPolicy.MIN_LENGTH} caracteres, con mayúsculas, minúsculas y números.`,
        "newPassword",
      );
    }
  }
}
