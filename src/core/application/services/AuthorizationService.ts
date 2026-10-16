import type { Actor } from "../../domain/auth/Actor";
import { ForbiddenError, UnauthenticatedError } from "../../domain/shared/DomainError";
import { RolePolicy, type Permission } from "../../domain/user/Role";

/** Verifica que el actor exista y tenga el permiso requerido antes de ejecutar una acción protegida. */
export class AuthorizationService {
  ensure(actor: Actor | null, permission: Permission): Actor {
    if (!actor) throw new UnauthenticatedError();
    if (!RolePolicy.allows(actor.role, permission)) throw new ForbiddenError();
    return actor;
  }
}
