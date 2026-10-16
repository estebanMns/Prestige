import type { Perfume } from "../../domain/perfume/Perfume";
import type { Gender, PerfumeCategory, ProductType } from "../../domain/perfume/PerfumeEnums";
import type { User } from "../../domain/user/User";
import type { RefreshToken } from "../../domain/auth/RefreshToken";
import type { AuditEntry } from "../../domain/audit/AuditEntry";
import type { StoreSettings } from "../../domain/settings/StoreSettings";

/*
 * Puertos de persistencia (interfaces). El núcleo depende de estas abstracciones;
 * la infraestructura (PostgreSQL con pg) las implementa. Así se puede cambiar de base de datos
 * o probar los casos de uso con implementaciones en memoria.
 */

export interface PerfumeFilter {
  category?: PerfumeCategory;
  gender?: Gender;
  type?: ProductType;
  search?: string;
}

export interface PerfumeRepository {
  findAll(filter?: PerfumeFilter): Promise<Perfume[]>;
  findById(id: string): Promise<Perfume | null>;
  findByIds(ids: string[]): Promise<Perfume[]>;
  slugExists(slug: string): Promise<boolean>;
  save(perfume: Perfume): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

export interface RefreshTokenRepository {
  findByHash(tokenHash: string): Promise<RefreshToken | null>;
  save(token: RefreshToken): Promise<void>;
  revokeFamily(familyId: string, at: Date): Promise<void>;
  revokeAllForUser(userId: string, at: Date): Promise<void>;
  /** true si la sesión tiene un refresh token vigente (no revocado ni vencido). */
  hasActiveFamily(familyId: string, now: Date): Promise<boolean>;
}

export interface AuditLogRepository {
  record(entry: AuditEntry): Promise<void>;
  latest(limit: number): Promise<AuditEntry[]>;
}

export interface StoreSettingsRepository {
  get(): Promise<StoreSettings>;
  save(settings: StoreSettings): Promise<void>;
}
