"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "./Icons";

interface DrawerProps {
  title: string;
  eyebrow?: string;
  onClose(): void;
  children: ReactNode;
  footer?: ReactNode;
}

/** Panel lateral accesible: se cierra con Escape o tocando fuera, y bloquea el scroll de la página. */
export function Drawer({ title, eyebrow, onClose, children, footer }: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("input,button")?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div ref={ref} className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-head">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h2 className="text-[28px] leading-tight">{title}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <CloseIcon />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </div>
    </>
  );
}
