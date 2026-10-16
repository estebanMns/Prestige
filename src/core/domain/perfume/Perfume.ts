import { Entity } from "../shared/Entity";
import { Guard } from "../shared/Guard";
import { ValidationError } from "../shared/DomainError";
import type { Money } from "../shared/Money";
import {
  CONCENTRATIONS,
  GENDERS,
  PERFUME_CATEGORIES,
  type Concentration,
  type Gender,
  type PerfumeCategory,
  type ProductType,
} from "./PerfumeEnums";
import { Presentation } from "./Presentation";

export interface OlfactoryNotes {
  top: string;
  heart: string;
  base: string;
}

export interface PerfumeProps {
  slug: string;
  name: string;
  house: string;
  category: PerfumeCategory;
  gender: Gender;
  concentration: Concentration;
  description: string;
  notes: OlfactoryNotes;
  presentations: Presentation[];
  imageKey: string | null;
  color: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Datos editables de un perfume, tal como llegan de un formulario ya validado en forma. */
export interface PerfumeDraft {
  name: string;
  house: string;
  category: string;
  gender: string;
  concentration: string;
  description: string;
  notes: OlfactoryNotes;
  presentations: { ml: number; type: string; priceCop: number; inStock?: boolean }[];
  imageKey: string | null;
  color: string;
  featured: boolean;
}

/**
 * Agregado raíz del catálogo. Garantiza sus propias reglas:
 * nombre y casa obligatorios, al menos una presentación y sin presentaciones repetidas.
 */
export class Perfume extends Entity<PerfumeProps> {
  private static readonly COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

  static create(id: string, slug: string, draft: PerfumeDraft, now: Date): Perfume {
    return new Perfume(id, { ...Perfume.validate(draft), slug, createdAt: now, updatedAt: now });
  }

  /** Reconstruye un perfume ya persistido (sin volver a validar reglas de creación). */
  static restore(id: string, props: PerfumeProps): Perfume {
    return new Perfume(id, props);
  }

  update(draft: PerfumeDraft, now: Date): void {
    this.props = { ...this.props, ...Perfume.validate(draft), updatedAt: now };
  }

  private static validate(draft: PerfumeDraft): Omit<PerfumeProps, "slug" | "createdAt" | "updatedAt"> {
    const name = Guard.maxLength(Guard.nonEmpty(draft.name, "name", "El nombre"), 120, "name", "El nombre");
    const house = Guard.maxLength(Guard.nonEmpty(draft.house, "house", "La casa"), 120, "house", "La casa");
    const presentations = draft.presentations.map((p) => Presentation.create(p));
    if (presentations.length === 0) {
      throw new ValidationError("Agrega al menos una presentación con mililitros y precio.", "presentations");
    }
    const keys = new Set(presentations.map((p) => p.key));
    if (keys.size !== presentations.length) {
      throw new ValidationError("Hay presentaciones repetidas con los mismos mililitros y tipo.", "presentations");
    }
    if (!Perfume.COLOR_PATTERN.test(draft.color)) throw new ValidationError("El color no es válido.", "color");

    return {
      name,
      house,
      category: Guard.oneOf(draft.category, PERFUME_CATEGORIES, "category", "La familia"),
      gender: Guard.oneOf(draft.gender, GENDERS, "gender", "El género"),
      concentration: Guard.oneOf(draft.concentration, CONCENTRATIONS, "concentration", "La concentración"),
      description: Guard.maxLength(draft.description.trim(), 2000, "description", "Los detalles"),
      notes: {
        top: draft.notes.top.trim(),
        heart: draft.notes.heart.trim(),
        base: draft.notes.base.trim(),
      },
      presentations: [...presentations].sort((a, b) => a.ml - b.ml || a.type.localeCompare(b.type)),
      imageKey: draft.imageKey,
      color: draft.color.toLowerCase(),
      featured: draft.featured,
    };
  }

  get slug(): string {
    return this.props.slug;
  }
  get name(): string {
    return this.props.name;
  }
  get house(): string {
    return this.props.house;
  }
  get category(): PerfumeCategory {
    return this.props.category;
  }
  get gender(): Gender {
    return this.props.gender;
  }
  get concentration(): Concentration {
    return this.props.concentration;
  }
  get description(): string {
    return this.props.description;
  }
  get notes(): OlfactoryNotes {
    return { ...this.props.notes };
  }
  get presentations(): readonly Presentation[] {
    return this.props.presentations;
  }
  get imageKey(): string | null {
    return this.props.imageKey;
  }
  get color(): string {
    return this.props.color;
  }
  get featured(): boolean {
    return this.props.featured;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /** Precio más bajo disponible, para mostrar "Desde $ …" en el catálogo. */
  startingPrice(): Money {
    const available = this.props.presentations.filter((p) => p.inStock);
    const pool = available.length ? available : this.props.presentations;
    return pool.reduce((min, p) => (p.price.isLessThan(min) ? p.price : min), pool[0]!.price);
  }

  findPresentation(ml: number, type: ProductType): Presentation | undefined {
    return this.props.presentations.find((p) => p.ml === ml && p.type === type);
  }

  /** Un perfume unisex aparece tanto en "Hombre" como en "Mujer". */
  isSuitableFor(gender: Gender): boolean {
    return this.props.gender === gender || this.props.gender === "UNISEX";
  }

  offersType(type: ProductType): boolean {
    return this.props.presentations.some((p) => p.type === type);
  }
}
