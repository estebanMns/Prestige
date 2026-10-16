"use client";

import { create } from "zustand";
import { useEffect } from "react";

interface ToastState {
  message: string | null;
  show(message: string): void;
  hide(): void;
}

export const useToast = create<ToastState>()((set) => ({
  message: null,
  show: (message) => set({ message }),
  hide: () => set({ message: null }),
}));

/** Mensaje breve de confirmación ("Agregado al pedido", "Cambios guardados"). */
export function Toast() {
  const { message, hide } = useToast();
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(hide, 2600);
    return () => window.clearTimeout(timer);
  }, [message, hide]);
  if (!message) return null;
  return (
    <div className="toast" role="status">
      {message}
    </div>
  );
}
