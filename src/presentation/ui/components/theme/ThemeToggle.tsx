"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark";

/** Interruptor claro (Azul Petróleo) / oscuro (Ónix Imperial). Guarda la elección en el navegador. */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("dark");

  useEffect(() => {
    setMode(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (localStorage.getItem("prestige.mode")) return;
      const next: Mode = media.matches ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      setMode(next);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next: Mode = mode === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.add("mode-anim");
    root.dataset.theme = next;
    window.setTimeout(() => root.classList.remove("mode-anim"), 500);
    try {
      localStorage.setItem("prestige.mode", next);
    } catch {
      /* almacenamiento bloqueado: el modo se aplica igual durante la visita */
    }
    setMode(next);
    window.dispatchEvent(new CustomEvent("prestige:theme", { detail: next }));
  };

  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"} title="Modo claro / oscuro">
      {mode === "dark" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      )}
    </button>
  );
}
