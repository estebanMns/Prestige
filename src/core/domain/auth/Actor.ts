import type { Role } from "../user/Role";

/** Quién ejecuta una acción. Se obtiene del access token ya verificado. */
export interface Actor {
  userId: string;
  email: string;
  role: Role;
  /** Identificador de la sesión (familia de refresh tokens). Si se cierra, el actor deja de ser válido. */
  sessionId: string;
}
