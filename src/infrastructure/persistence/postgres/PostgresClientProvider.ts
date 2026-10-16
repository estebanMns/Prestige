import "server-only";
import { Pool } from "pg";
import { createPoolConfig } from "./poolConfig";

/**
 * Un solo pool de conexiones por proceso. En desarrollo, la recarga en caliente de Next.js
 * crearía un pool nuevo en cada cambio y agotaría las conexiones; por eso se guarda en globalThis.
 */
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export function getPool(): Pool {
  if (!globalForPg.pgPool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL es obligatoria. Revisa tu archivo .env.");
    globalForPg.pgPool = new Pool(createPoolConfig(databaseUrl));
  }
  return globalForPg.pgPool;
}
