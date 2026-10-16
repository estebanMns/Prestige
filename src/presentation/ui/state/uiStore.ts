"use client";

import { create } from "zustand";
import type { Gender, PerfumeCategory, ProductType } from "@/core/domain/perfume/PerfumeEnums";

export type Panel = "cart" | "checkout" | "chat" | null;

export interface CatalogFilter {
  category: PerfumeCategory | "";
  gender: Gender | "";
  type: ProductType | "";
  search: string;
}

interface UiState {
  panel: Panel;
  selectedPerfumeId: string | null;
  filter: CatalogFilter;
  open(panel: Panel): void;
  close(): void;
  showPerfume(id: string | null): void;
  setFilter(patch: Partial<CatalogFilter>): void;
}

/** Estado de la interfaz compartido entre componentes: panel abierto, perfume seleccionado y filtros. */
export const useUi = create<UiState>()((set) => ({
  panel: null,
  selectedPerfumeId: null,
  filter: { category: "", gender: "", type: "", search: "" },
  open: (panel) => set({ panel }),
  close: () => set({ panel: null }),
  showPerfume: (id) => set({ selectedPerfumeId: id }),
  setFilter: (patch) => set((s) => ({ filter: { ...s.filter, ...patch } })),
}));
