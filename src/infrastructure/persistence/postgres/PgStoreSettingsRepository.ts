import type { Pool } from "pg";
import type { StoreSettingsRepository } from "@/core/application/ports/repositories";
import { StoreSettings } from "@/core/domain/settings/StoreSettings";
import type { StoreSettingsRow } from "./rows";

/** Configuración de la tienda: una sola fila con id = 1 (la crea la migración). */
export class PgStoreSettingsRepository implements StoreSettingsRepository {
  constructor(private readonly db: Pool) {}

  async get(): Promise<StoreSettings> {
    const { rows } = await this.db.query<StoreSettingsRow>(
      "SELECT whatsapp, email, address, hours, instagram, tiktok, facebook, about FROM store_settings WHERE id = 1",
    );
    const row = rows[0];
    if (!row) return StoreSettings.empty();
    return StoreSettings.restore({ ...row });
  }

  async save(settings: StoreSettings): Promise<void> {
    const s = settings.toJSON();
    await this.db.query(
      `INSERT INTO store_settings (id, whatsapp, email, address, hours, instagram, tiktok, facebook, about)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         whatsapp = EXCLUDED.whatsapp, email = EXCLUDED.email, address = EXCLUDED.address, hours = EXCLUDED.hours,
         instagram = EXCLUDED.instagram, tiktok = EXCLUDED.tiktok, facebook = EXCLUDED.facebook,
         about = EXCLUDED.about, updated_at = now()`,
      [s.whatsapp, s.email, s.address, s.hours, s.instagram, s.tiktok, s.facebook, s.about],
    );
  }
}
