import type { PerfumeDTO } from "@/core/application/dto/PerfumeDTO";
import { normalize } from "../../../lib/format";
import type { CatalogFilter } from "../../../state/uiStore";

/** Filtra el catálogo en el navegador (respuesta instantánea al tocar un filtro). */
export class CatalogFilterService {
  static apply(perfumes: PerfumeDTO[], filter: CatalogFilter): PerfumeDTO[] {
    const terms = normalize(filter.search).split(/\s+/).filter(Boolean);
    return perfumes.filter((p) => {
      if (filter.category && p.category !== filter.category) return false;
      if (filter.gender && p.gender !== filter.gender && p.gender !== "UNISEX") return false;
      if (filter.type && !p.presentations.some((v) => v.type === filter.type)) return false;
      if (terms.length) {
        const hay = normalize([p.name, p.house, p.description, p.notes.top, p.notes.heart, p.notes.base, p.categoryLabel].join(" "));
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
  }

  static title(filter: CatalogFilter): string {
    const base = { NICHO: "Perfumes de nicho", DISENADOR: "Perfumes de diseñador", ARABE: "Perfumes árabes", "": "La colección" }[filter.category];
    if (filter.gender === "HOMBRE") return `${base} para hombre`;
    if (filter.gender === "MUJER") return `${base} para mujer`;
    return base;
  }
}
