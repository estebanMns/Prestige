import type { Concentration, Gender, PerfumeCategory, ProductType } from "@/core/domain/perfume/PerfumeEnums";
import type { Role } from "@/core/domain/user/Role";

/* Filas tal como las devuelve PostgreSQL (snake_case). Solo las usan los repositorios y los mapeadores. */

export interface PerfumeRow {
  id: string;
  slug: string;
  name: string;
  house: string;
  category: PerfumeCategory;
  gender: Gender;
  concentration: Concentration;
  description: string;
  notes_top: string;
  notes_heart: string;
  notes_base: string;
  image_key: string | null;
  color: string;
  featured: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PresentationRow {
  perfume_id: string;
  ml: number;
  type: ProductType;
  price_cop: number;
  in_stock: boolean;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  totp_secret: string | null;
  totp_enabled: boolean;
  failed_login_count: number;
  locked_until: Date | null;
  last_login_at: Date | null;
}

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  family_id: string;
  expires_at: Date;
  revoked_at: Date | null;
}

export interface AuditLogRow {
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: Date;
}

export interface StoreSettingsRow {
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  about: string;
}
