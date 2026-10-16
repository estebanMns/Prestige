/**
 * Errores del dominio. Cada tipo representa una situación de negocio, no un detalle HTTP:
 * la capa de presentación decide cómo traducirlos (ver HttpErrorMapper).
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";
  constructor(entity: string) {
    super(`${entity} no encontrado.`);
  }
}

export class ConflictError extends DomainError {
  readonly code = "CONFLICT";
  constructor(message: string) {
    super(message);
  }
}

export class InvalidCredentialsError extends DomainError {
  readonly code = "INVALID_CREDENTIALS";
  constructor() {
    super("Correo o contraseña incorrectos.");
  }
}

export class TotpRequiredError extends DomainError {
  readonly code = "TOTP_REQUIRED";
  constructor() {
    super("Ingresa el código de verificación de tu aplicación autenticadora.");
  }
}

export class AccountLockedError extends DomainError {
  readonly code = "ACCOUNT_LOCKED";
  constructor(readonly until: Date) {
    super("Demasiados intentos fallidos. La cuenta está bloqueada temporalmente.");
  }
}

export class UnauthenticatedError extends DomainError {
  readonly code = "UNAUTHENTICATED";
  constructor(message = "Tu sesión expiró. Inicia sesión de nuevo.") {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  readonly code = "FORBIDDEN";
  constructor(message = "No tienes permiso para realizar esta acción.") {
    super(message);
  }
}

export class RateLimitedError extends DomainError {
  readonly code = "RATE_LIMITED";
  constructor(readonly retryAfterSeconds: number) {
    super("Demasiadas solicitudes. Intenta de nuevo en unos minutos.");
  }
}
