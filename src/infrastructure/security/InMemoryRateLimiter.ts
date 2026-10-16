import type { Clock, RateLimiter } from "@/core/application/ports/services";

/**
 * Límite de solicitudes por ventana fija, en memoria del proceso.
 * Suficiente para una sola instancia. Con varias instancias (balanceador en AWS/Azure)
 * reemplázalo por una implementación sobre Redis que cumpla la misma interfaz RateLimiter.
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly maxHits: number,
    private readonly windowSeconds: number,
    private readonly clock: Clock,
  ) {}

  async consume(key: string): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
    const now = this.clock.now().getTime();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowSeconds * 1000 });
      this.evictExpired(now);
      return { allowed: true, retryAfterSeconds: 0 };
    }
    entry.count += 1;
    if (entry.count > this.maxHits) {
      return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  async reset(key: string): Promise<void> {
    this.hits.delete(key);
  }

  private evictExpired(now: number): void {
    if (this.hits.size < 5_000) return;
    for (const [key, value] of this.hits) if (value.resetAt <= now) this.hits.delete(key);
  }
}
