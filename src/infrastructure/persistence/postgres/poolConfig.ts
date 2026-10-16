import { readFileSync } from "node:fs";
import type { PoolConfig } from "pg";

/**
 * Configuración de la conexión a PostgreSQL a partir de DATABASE_URL.
 * Si la URL pide SSL (sslmode distinto de "disable"), el certificado del servidor se verifica
 * con el bundle de AWS RDS indicado en DATABASE_SSL_CA_FILE. Los parámetros de la URL se quitan
 * y el SSL se pasa explícito, para que el comportamiento sea el mismo en desarrollo y en producción.
 *
 * No importa "server-only": la usan también los scripts de migración y de seed, que corren fuera de Next.js.
 */
export function createPoolConfig(databaseUrl: string, caFile = process.env.DATABASE_SSL_CA_FILE): PoolConfig {
  const url = new URL(databaseUrl);
  const sslmode = url.searchParams.get("sslmode");
  url.search = "";

  const usesSsl = sslmode !== null && sslmode !== "disable";
  return {
    connectionString: url.toString(),
    ssl: usesSsl ? { rejectUnauthorized: true, ...(caFile ? { ca: readFileSync(caFile, "utf8") } : {}) } : undefined,
    max: 10,
    connectionTimeoutMillis: 10_000,
  };
}
