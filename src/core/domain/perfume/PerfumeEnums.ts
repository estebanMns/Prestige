/**
 * Catálogos cerrados del dominio. Los valores coinciden con los enums de la base de datos;
 * las etiquetas son el texto que ve el cliente.
 */
export const PERFUME_CATEGORIES = ["NICHO", "DISENADOR", "ARABE"] as const;
export type PerfumeCategory = (typeof PERFUME_CATEGORIES)[number];
export const CATEGORY_LABELS: Record<PerfumeCategory, string> = {
  NICHO: "Nicho",
  DISENADOR: "Diseñador",
  ARABE: "Árabe",
};

export const GENDERS = ["HOMBRE", "MUJER", "UNISEX"] as const;
export type Gender = (typeof GENDERS)[number];
export const GENDER_LABELS: Record<Gender, string> = {
  HOMBRE: "Hombre",
  MUJER: "Mujer",
  UNISEX: "Unisex",
};

export const CONCENTRATIONS = [
  "EAU_DE_COLOGNE",
  "EAU_DE_TOILETTE",
  "EAU_DE_PARFUM",
  "PARFUM",
  "EXTRAIT_DE_PARFUM",
  "ELIXIR",
] as const;
export type Concentration = (typeof CONCENTRATIONS)[number];
export const CONCENTRATION_LABELS: Record<Concentration, string> = {
  EAU_DE_COLOGNE: "Eau de Cologne",
  EAU_DE_TOILETTE: "Eau de Toilette",
  EAU_DE_PARFUM: "Eau de Parfum",
  PARFUM: "Parfum",
  EXTRAIT_DE_PARFUM: "Extrait de Parfum",
  ELIXIR: "Elixir",
};

export const PRODUCT_TYPES = ["ORIGINAL", "REPLICA_1_1"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  ORIGINAL: "Original",
  REPLICA_1_1: "1.1",
};
