export const ROLES = ["PROPIETARIO", "ADMIN", "ASESOR"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  PROPIETARIO: "Propietario",
  ADMIN: "Administrador",
  ASESOR: "Asesor",
};

/** Acciones protegidas del sistema. */
export enum Permission {
  PerfumeCreate = "perfume:create",
  PerfumeUpdate = "perfume:update",
  PerfumeDelete = "perfume:delete",
  ImageUpload = "image:upload",
  SettingsUpdate = "settings:update",
  AuditRead = "audit:read",
}

/**
 * Política de permisos por rol. Es la única fuente de verdad de "quién puede qué":
 * agregar un rol o un permiso nuevo solo requiere cambiar este mapa.
 */
export class RolePolicy {
  private static readonly grants: Record<Role, ReadonlySet<Permission>> = {
    PROPIETARIO: new Set(Object.values(Permission)),
    // El administrador gestiona el catálogo y los pedidos, pero no los datos de contacto de la tienda.
    ADMIN: new Set(Object.values(Permission).filter((p) => p !== Permission.SettingsUpdate)),
    ASESOR: new Set([Permission.PerfumeCreate, Permission.PerfumeUpdate, Permission.ImageUpload]),
  };

  static allows(role: Role, permission: Permission): boolean {
    return RolePolicy.grants[role].has(permission);
  }

  static permissionsOf(role: Role): Permission[] {
    return [...RolePolicy.grants[role]];
  }
}
