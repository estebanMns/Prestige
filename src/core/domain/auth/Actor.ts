import type { Role } from "../user/Role";

/** Quién ejecuta una acción. Se obtiene del access token ya verificado. */
export interface Actor {
  userId: string;
  email: string;
  role: Role;
}
