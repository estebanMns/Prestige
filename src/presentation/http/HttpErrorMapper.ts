import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  AccountLockedError,
  DomainError,
  RateLimitedError,
  ValidationError,
} from "@/core/domain/shared/DomainError";

export interface ApiErrorBody {
  error: { code: string; message: string; field?: string; retryAfterSeconds?: number };
}

/** Traduce errores del dominio a respuestas HTTP. Los errores inesperados nunca exponen detalles internos. */
export class HttpErrorMapper {
  private static readonly STATUS: Record<string, number> = {
    VALIDATION_ERROR: 422,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INVALID_CREDENTIALS: 401,
    TOTP_REQUIRED: 401,
    UNAUTHENTICATED: 401,
    ACCOUNT_LOCKED: 423,
    FORBIDDEN: 403,
    RATE_LIMITED: 429,
  };

  static toResponse(error: unknown): NextResponse<ApiErrorBody> {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: issue?.message ?? "Datos no válidos.", field: issue?.path.join(".") } },
        { status: 422 },
      );
    }
    if (error instanceof DomainError) {
      const body: ApiErrorBody = { error: { code: error.code, message: error.message } };
      const headers = new Headers();
      if (error instanceof ValidationError && error.field) body.error.field = error.field;
      if (error instanceof RateLimitedError) {
        body.error.retryAfterSeconds = error.retryAfterSeconds;
        headers.set("Retry-After", String(error.retryAfterSeconds));
      }
      if (error instanceof AccountLockedError) {
        body.error.retryAfterSeconds = Math.max(0, Math.ceil((error.until.getTime() - Date.now()) / 1000));
      }
      return NextResponse.json(body, { status: HttpErrorMapper.STATUS[error.code] ?? 400, headers });
    }
    console.error("[api] error inesperado", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Ocurrió un error inesperado. Inténtalo de nuevo en unos minutos." } },
      { status: 500 },
    );
  }
}
