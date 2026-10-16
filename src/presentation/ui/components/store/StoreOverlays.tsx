"use client";

import type { PerfumeDTO } from "@/core/application/dto/PerfumeDTO";
import { Toast } from "../common/Toast";
import { useUi } from "../../state/uiStore";
import { CartDrawer } from "./cart/CartDrawer";
import { CheckoutDrawer } from "./cart/CheckoutDrawer";
import { PerfumeModal } from "./catalog/PerfumeModal";
import { ChatWidget } from "./chat/ChatWidget";

/** Monta los paneles flotantes de la tienda según el estado de la interfaz. */
export function StoreOverlays({ perfumes }: { perfumes: PerfumeDTO[] }) {
  const panel = useUi((s) => s.panel);
  return (
    <>
      {panel === "cart" && <CartDrawer />}
      {panel === "checkout" && <CheckoutDrawer />}
      <PerfumeModal perfumes={perfumes} />
      <ChatWidget perfumes={perfumes} />
      <Toast />
    </>
  );
}
