"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PerfumeDTO, PresentationDTO } from "@/core/application/dto/PerfumeDTO";

export interface CartLine {
  key: string;
  perfumeId: string;
  name: string;
  house: string;
  ml: number;
  type: PresentationDTO["type"];
  typeLabel: string;
  unitPriceCop: number;
  quantity: number;
  imageUrl: string | null;
  color: string;
}

interface CartState {
  lines: CartLine[];
  add(perfume: PerfumeDTO, presentation: PresentationDTO, quantity: number): void;
  setQuantity(key: string, quantity: number): void;
  remove(key: string): void;
  clear(): void;
}

const MAX_QTY = 20;

/**
 * Carrito del cliente, guardado en su navegador. Los precios aquí son solo para mostrar:
 * al enviar el pedido el servidor recalcula todo con los precios vigentes.
 */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (perfume, presentation, quantity) =>
        set((state) => {
          const key = `${perfume.id}:${presentation.ml}:${presentation.type}`;
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return { lines: state.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l)) };
          }
          return {
            lines: [
              ...state.lines,
              {
                key,
                perfumeId: perfume.id,
                name: perfume.name,
                house: perfume.house,
                ml: presentation.ml,
                type: presentation.type,
                typeLabel: presentation.typeLabel,
                unitPriceCop: presentation.priceCop,
                quantity: Math.min(MAX_QTY, quantity),
                imageUrl: perfume.imageUrl,
                color: perfume.color,
              },
            ],
          };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({ lines: state.lines.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, Math.min(MAX_QTY, quantity)) } : l)) })),
      remove: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "prestige.cart", storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

export const cartTotal = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.unitPriceCop * l.quantity, 0);
export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
