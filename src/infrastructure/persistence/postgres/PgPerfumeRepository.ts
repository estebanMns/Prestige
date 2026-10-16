import type { Pool } from "pg";
import type { PerfumeFilter, PerfumeRepository } from "@/core/application/ports/repositories";
import type { Perfume } from "@/core/domain/perfume/Perfume";
import { PerfumeMapper } from "./mappers/PerfumeMapper";
import type { PerfumeRow, PresentationRow } from "./rows";

/** Escapa los comodines de LIKE para que la búsqueda sea literal. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, "\\$&");
}

export class PgPerfumeRepository implements PerfumeRepository {
  constructor(private readonly db: Pool) {}

  async findAll(filter: PerfumeFilter = {}): Promise<Perfume[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    const param = (value: unknown): string => {
      params.push(value);
      return `$${params.length}`;
    };

    if (filter.category) where.push(`p.category = ${param(filter.category)}`);
    if (filter.gender) where.push(`p.gender IN (${param(filter.gender)}, 'UNISEX')`);
    if (filter.type) where.push(`EXISTS (SELECT 1 FROM presentations pr WHERE pr.perfume_id = p.id AND pr.type = ${param(filter.type)})`);
    if (filter.search) {
      const term = param(`%${escapeLike(filter.search.trim())}%`);
      where.push(`(p.name ILIKE ${term} OR p.house ILIKE ${term} OR p.notes_top ILIKE ${term} OR p.notes_heart ILIKE ${term} OR p.notes_base ILIKE ${term})`);
    }

    const sql = `SELECT p.* FROM perfumes p${where.length ? ` WHERE ${where.join(" AND ")}` : ""}`;
    const { rows } = await this.db.query<PerfumeRow>(sql, params);
    return this.withPresentations(rows);
  }

  async findById(id: string): Promise<Perfume | null> {
    const { rows } = await this.db.query<PerfumeRow>("SELECT * FROM perfumes WHERE id = $1", [id]);
    const [perfume] = await this.withPresentations(rows);
    return perfume ?? null;
  }

  async findByIds(ids: string[]): Promise<Perfume[]> {
    if (ids.length === 0) return [];
    const { rows } = await this.db.query<PerfumeRow>("SELECT * FROM perfumes WHERE id = ANY($1::uuid[])", [ids]);
    return this.withPresentations(rows);
  }

  async slugExists(slug: string): Promise<boolean> {
    const { rowCount } = await this.db.query("SELECT 1 FROM perfumes WHERE slug = $1 LIMIT 1", [slug]);
    return (rowCount ?? 0) > 0;
  }

  /** Guarda el perfume y reemplaza sus presentaciones en una sola transacción. */
  async save(perfume: Perfume): Promise<void> {
    const presentations = PerfumeMapper.presentationsToPersistence(perfume);
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO perfumes (id, slug, name, house, category, gender, concentration, description,
                               notes_top, notes_heart, notes_base, image_key, color, featured, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug, name = EXCLUDED.name, house = EXCLUDED.house, category = EXCLUDED.category,
           gender = EXCLUDED.gender, concentration = EXCLUDED.concentration, description = EXCLUDED.description,
           notes_top = EXCLUDED.notes_top, notes_heart = EXCLUDED.notes_heart, notes_base = EXCLUDED.notes_base,
           image_key = EXCLUDED.image_key, color = EXCLUDED.color, featured = EXCLUDED.featured,
           updated_at = EXCLUDED.updated_at`,
        PerfumeMapper.toPersistence(perfume),
      );
      await client.query("DELETE FROM presentations WHERE perfume_id = $1", [perfume.id]);
      for (const p of presentations) {
        await client.query(
          "INSERT INTO presentations (perfume_id, ml, type, price_cop, in_stock) VALUES ($1, $2, $3, $4, $5)",
          [perfume.id, p.ml, p.type, p.priceCop, p.inStock],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /** Las presentaciones se borran en cascada (ON DELETE CASCADE). */
  async delete(id: string): Promise<void> {
    await this.db.query("DELETE FROM perfumes WHERE id = $1", [id]);
  }

  /** Une cada perfume con sus presentaciones en dos consultas, sin importar cuántos perfumes haya. */
  private async withPresentations(rows: PerfumeRow[]): Promise<Perfume[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const { rows: presentationRows } = await this.db.query<PresentationRow & { perfume_id: string }>(
      "SELECT * FROM presentations WHERE perfume_id = ANY($1::uuid[])",
      [ids],
    );
    const byPerfume = new Map<string, PresentationRow[]>();
    for (const p of presentationRows) {
      const list = byPerfume.get(p.perfume_id) ?? [];
      list.push(p);
      byPerfume.set(p.perfume_id, list);
    }
    return rows.map((row) => PerfumeMapper.toDomain(row, byPerfume.get(row.id) ?? []));
  }
}
