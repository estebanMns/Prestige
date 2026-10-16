/** Esencias que el cliente puede elegir para el frasco 3D del hero. */
export interface Essence {
  id: string;
  label: string;
  liquid: string;
  glow: string;
  gem: string;
}

export const ESSENCES: Essence[] = [
  { id: "berries", label: "Frutos rojos", liquid: "#a82848", glow: "#2a0610", gem: "#e07a90" },
  { id: "caramel", label: "Caramelo", liquid: "#b86a2a", glow: "#2a1206", gem: "#e0a060" },
  { id: "vanilla", label: "Vainilla", liquid: "#ecd6ae", glow: "#2a2010", gem: "#f3e4c4" },
];
