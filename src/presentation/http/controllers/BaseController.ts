import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { ValidationError } from "@/core/domain/shared/DomainError";
import { HttpErrorMapper } from "../HttpErrorMapper";

/**
 * Comportamiento común de los controladores: convertir cualquier error en una respuesta HTTP
 * coherente y validar el cuerpo JSON con un esquema. Los controladores solo traducen HTTP ⇄ casos de uso.
 */
export abstract class BaseController {
  protected async handle(action: () => Promise<NextResponse>): Promise<NextResponse> {
    try {
      return await action();
    } catch (error) {
      return HttpErrorMapper.toResponse(error);
    }
  }

  protected async body<T extends z.ZodType>(request: NextRequest, schema: T): Promise<z.infer<T>> {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      throw new ValidationError("El cuerpo de la solicitud no es JSON válido.");
    }
    return schema.parse(raw);
  }

  protected ok<T>(data: T, init?: ResponseInit): NextResponse {
    return NextResponse.json({ data }, init);
  }

  protected noContent(): NextResponse {
    return new NextResponse(null, { status: 204 });
  }
}
