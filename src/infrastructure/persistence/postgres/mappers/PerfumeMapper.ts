import { Perfume } from "@/core/domain/perfume/Perfume";
import { Presentation } from "@/core/domain/perfume/Presentation";
import type { PerfumeRow, PresentationRow } from "../rows";

/** Traduce entre filas de PostgreSQL y entidades del dominio. */
export class PerfumeMapper {
  static toDomain(row: PerfumeRow, presentations: PresentationRow[]): Perfume {
    return Perfume.restore(row.id, {
      slug: row.slug,
      name: row.name,
      house: row.house,
      category: row.category,
      gender: row.gender,
      concentration: row.concentration,
      description: row.description,
      notes: { top: row.notes_top, heart: row.notes_heart, base: row.notes_base },
      presentations: presentations
        .map((p) => Presentation.create({ ml: p.ml, type: p.type, priceCop: p.price_cop, inStock: p.in_stock }))
        .sort((a, b) => a.ml - b.ml),
      imageKey: row.image_key,
      color: row.color,
      featured: row.featured,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  /** Valores de la fila de perfumes, en el orden de las columnas de PerfumeRepository.save. */
  static toPersistence(perfume: Perfume): unknown[] {
    return [
      perfume.id,
      perfume.slug,
      perfume.name,
      perfume.house,
      perfume.category,
      perfume.gender,
      perfume.concentration,
      perfume.description,
      perfume.notes.top,
      perfume.notes.heart,
      perfume.notes.base,
      perfume.imageKey,
      perfume.color,
      perfume.featured,
      perfume.createdAt,
      perfume.updatedAt,
    ];
  }

  static presentationsToPersistence(perfume: Perfume): { ml: number; type: string; priceCop: number; inStock: boolean }[] {
    return perfume.presentations.map((p) => ({ ml: p.ml, type: p.type, priceCop: p.price.amount, inStock: p.inStock }));
  }
}
