import type { PerfumeDTO } from "@/core/application/dto/PerfumeDTO";

/**
 * Franja animada con los perfumes destacados (los que el administrador marca como "destacado").
 * La lista se repite dos veces para que el desplazamiento sea continuo; la copia repetida se oculta a lectores de pantalla.
 * Con "reducir movimiento" activado, la animación se desactiva globalmente en globals.css.
 * La duración crece con la cantidad de perfumes para que la velocidad sea siempre suave.
 */
const SECONDS_PER_PERFUME = 13;
const MIN_PERFUMES_FOR_SPEED = 3;

export function PerfumeMarquee({ perfumes }: { perfumes: PerfumeDTO[] }) {
  if (perfumes.length === 0) return null;
  const duration = Math.max(perfumes.length, MIN_PERFUMES_FOR_SPEED) * SECONDS_PER_PERFUME;

  return (
    <section aria-label="Perfumes destacados" className="overflow-hidden border-y border-line py-6">
      <div
        className="flex w-max animate-[marquee_linear_infinite] hover:[animation-play-state:paused]"
        style={{ animationDuration: `${duration}s` }}
      >
        {[false, true].map((repeated) => (
          <ul key={repeated ? "copy" : "original"} aria-hidden={repeated} className="flex shrink-0 items-center">
            {perfumes.map((perfume) => (
              <li key={perfume.slug} className="flex items-center">
                <span className="whitespace-nowrap px-8 font-display text-[clamp(26px,3.2vw,40px)] italic text-muted">{perfume.name}</span>
                <span aria-hidden="true" className="text-[var(--metal)]">
                  ✦
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
