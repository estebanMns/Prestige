import type { Perfume } from "../../domain/perfume/Perfume";
import {
  CATEGORY_LABELS,
  CONCENTRATION_LABELS,
  GENDER_LABELS,
  PRODUCT_TYPE_LABELS,
  type Concentration,
  type Gender,
  type PerfumeCategory,
  type ProductType,
} from "../../domain/perfume/PerfumeEnums";
import type { FileStorage } from "../ports/services";

/** Forma serializable de un perfume para la interfaz y la API (sin lógica, solo datos). */
export interface PresentationDTO {
  ml: number;
  type: ProductType;
  typeLabel: string;
  priceCop: number;
  priceLabel: string;
  inStock: boolean;
}

export interface PerfumeDTO {
  id: string;
  slug: string;
  name: string;
  house: string;
  category: PerfumeCategory;
  categoryLabel: string;
  gender: Gender;
  genderLabel: string;
  concentration: Concentration;
  concentrationLabel: string;
  description: string;
  notes: { top: string; heart: string; base: string };
  presentations: PresentationDTO[];
  imageKey: string | null;
  imageUrl: string | null;
  color: string;
  featured: boolean;
  startingPriceCop: number;
  startingPriceLabel: string;
  updatedAt: string;
}

/** Convierte entidades del dominio en DTOs. Responsabilidad única: presentación de datos. */
export class PerfumePresenter {
  constructor(private readonly storage: FileStorage) {}

  toDTO(perfume: Perfume): PerfumeDTO {
    const starting = perfume.startingPrice();
    return {
      id: perfume.id,
      slug: perfume.slug,
      name: perfume.name,
      house: perfume.house,
      category: perfume.category,
      categoryLabel: CATEGORY_LABELS[perfume.category],
      gender: perfume.gender,
      genderLabel: GENDER_LABELS[perfume.gender],
      concentration: perfume.concentration,
      concentrationLabel: CONCENTRATION_LABELS[perfume.concentration],
      description: perfume.description,
      notes: perfume.notes,
      presentations: perfume.presentations.map((p) => ({
        ml: p.ml,
        type: p.type,
        typeLabel: PRODUCT_TYPE_LABELS[p.type],
        priceCop: p.price.amount,
        priceLabel: p.price.format(),
        inStock: p.inStock,
      })),
      imageKey: perfume.imageKey,
      imageUrl: perfume.imageKey ? this.storage.publicUrl(perfume.imageKey) : null,
      color: perfume.color,
      featured: perfume.featured,
      startingPriceCop: starting.amount,
      startingPriceLabel: starting.format(),
      updatedAt: perfume.updatedAt.toISOString(),
    };
  }

  toDTOs(perfumes: Perfume[]): PerfumeDTO[] {
    return perfumes.map((p) => this.toDTO(p));
  }
}
