"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PerfumeCategory } from "@/core/domain/perfume/PerfumeEnums";
import { BagIcon } from "../common/Icons";
import { ThemeToggle } from "../theme/ThemeToggle";
import { cartCount, useCart } from "../../state/cartStore";
import { useUi } from "../../state/uiStore";

const NAV: { label: string; category: PerfumeCategory | "" }[] = [
  { label: "Nicho", category: "NICHO" },
  { label: "Diseñador", category: "DISENADOR" },
  { label: "Árabes", category: "ARABE" },
  { label: "Toda la colección", category: "" },
];

export function Header() {
  const lines = useCart((s) => s.lines);
  const { open, setFilter } = useUi();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(lines) : 0;

  return (
    <header className="site-header">
      <div className="wrap flex h-[70px] items-center gap-6">
        <Link className="logo" href="/" aria-label="Perfumería Prestige, inicio">
          <b>PRESTIGE</b>
          <span>PERFUMERÍA</span>
        </Link>
        <nav className="ml-auto hidden gap-6 md:flex" aria-label="Secciones">
          {NAV.map((item) => (
            <a
              key={item.label}
              href="#coleccion"
              onClick={() => setFilter({ category: item.category, gender: "" })}
              className="text-[13.5px] tracking-wide text-muted no-underline transition-colors hover:text-fg"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2.5 md:ml-0">
          <ThemeToggle />
          <button type="button" className="icon-btn" onClick={() => open("cart")} aria-label={`Abrir carrito (${count} productos)`}>
            <BagIcon />
            {count > 0 && <span className="badge-count">{count}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
