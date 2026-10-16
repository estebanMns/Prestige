import { readFileSync } from "node:fs";
import type { PoolConfig } from "pg";

/**
 * Configuración de la conexión a PostgreSQL a partir de DATABASE_URL.
 * Si la URL pide SSL (sslmode distinto de "disable"), el certificado del servidor se verifica
 * con el bundle de AWS RDS. El bundle se toma de DATABASE_SSL_CA (contenido del .pem, para hosting
 * donde el archivo no existe en disco, como Amplify) o, si no está, de DATABASE_SSL_CA_FILE (ruta al archivo).
 * Los parámetros de la URL se quitan y el SSL se pasa explícito, para que el comportamiento sea el mismo
 * en desarrollo y en producción.
 *
 * No importa "server-only": la usan también los scripts de migración y de seed, que corren fuera de Next.js.
 */
export function createPoolConfig(
  databaseUrl: string,
  caFile = process.env.DATABASE_SSL_CA_FILE,
  caPem = process.env.DATABASE_SSL_CA,
): PoolConfig {
  const url = new URL(databaseUrl);
  const sslmode = url.searchParams.get("sslmode");
  url.search = "";

  // En las variables de hosting el PEM suele llegar con los saltos de línea escapados como "\n".
  const ca = caPem ? caPem.replace(/\\n/g, "\n") : caFile ? readFileSync(caFile, "utf8") : undefined;
  const usesSsl = sslmode !== null && sslmode !== "disable";
  return {
    connectionString: url.toString(),
    ssl: usesSsl ? { rejectUnauthorized: true, ...(ca ? { ca } : {}) } : undefined,
    max: 10,
    connectionTimeoutMillis: 10_000,
  };
}
