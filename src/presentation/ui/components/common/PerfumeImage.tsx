import { BottleIllustration } from "./BottleIllustration";

/** Muestra la foto del perfume o, si no tiene, el frasco ilustrado con su color. */
export function PerfumeImage({
  imageUrl,
  color,
  alt,
  illustrationClass = "w-[46%]",
  fill = false,
}: {
  imageUrl: string | null;
  color: string;
  alt: string;
  illustrationClass?: string;
  /** Ocupa todo el contenedor (que debe ser relative) sin desbordarlo. */
  fill?: boolean;
}) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- las fotos vienen de S3/CDN con su propio caché
    return <img src={imageUrl} alt={alt} loading="lazy" className={fill ? "absolute inset-0 h-full w-full object-cover" : "h-full w-full object-cover"} />;
  }
  return <BottleIllustration color={color} className={illustrationClass} />;
}

export function glowFor(hex: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return "rgba(var(--accent-rgb), .2)";
  const n = parseInt(match[1]!, 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, .32)`;
}
