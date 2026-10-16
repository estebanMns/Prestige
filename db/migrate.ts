/**
 * Aplica las migraciones SQL de db/migrations en orden. Cada archivo corre en una transacción
 * y se registra en la tabla schema_migrations, así que correrlo de nuevo no repite nada.
 *
 * Uso:
 *   npm run db:migrate            → usa DATABASE_URL de .env (desarrollo)
 *   npm run db:migrate:prod       → usa DATABASE_URL de .env.rds (AWS RDS)
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { createPoolConfig } from "../src/infrastructure/persistence/postgres/poolConfig";

const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL no está definida. Revisa el archivo .env que usas.");

  const pool = new Pool(createPoolConfig(databaseUrl));
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    const { rows } = await client.query<{ name: string }>("SELECT name FROM schema_migrations");
    const applied = new Set(rows.map((r) => r.name));

    const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Ya aplicada: ${file}`);
        continue;
      }
      const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`Aplicada: ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
    console.log("Migraciones al día.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("Error en la migración:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
