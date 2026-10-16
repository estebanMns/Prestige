import { useId } from "react";

/** Frasco ilustrado (diseño propio de Prestige) para los perfumes que aún no tienen foto. */
export function BottleIllustration({ color, className }: { color: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 170" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}l`} x1="0" x2="1">
          <stop offset="0" stopColor={color} stopOpacity=".95" />
          <stop offset=".45" stopColor={color} stopOpacity=".6" />
          <stop offset="1" stopColor={color} stopOpacity=".95" />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" x2="1">
          <stop offset="0" stopColor="#7a5a2c" />
          <stop offset=".4" stopColor="#f3d9a4" />
          <stop offset=".7" stopColor="#b48a4c" />
          <stop offset="1" stopColor="#6b4c22" />
        </linearGradient>
      </defs>
      <rect x="42" y="6" width="36" height="30" rx="4" fill={`url(#${id}c)`} />
      <rect x="50" y="36" width="20" height="10" fill={`url(#${id}c)`} opacity=".8" />
      <rect x="14" y="46" width="92" height="118" rx="12" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.35)" strokeWidth="1.2" />
      <rect x="20" y="62" width="80" height="96" rx="8" fill={`url(#${id}l)`} />
      <rect x="34" y="96" width="52" height="26" rx="2" fill="rgba(20,16,14,.6)" stroke="rgba(243,217,164,.6)" strokeWidth=".6" />
      <text x="60" y="108" textAnchor="middle" fontFamily="Georgia,serif" fontSize="8" letterSpacing="1.5" fill="#f3e3c4">PRESTIGE</text>
      <text x="60" y="117" textAnchor="middle" fontFamily="monospace" fontSize="3.6" letterSpacing="1" fill="#d4b07a">EAU DE PARFUM</text>
    </svg>
  );
}
