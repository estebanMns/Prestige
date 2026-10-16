/**
 * Datos iniciales: los administradores (desde variables de entorno) y, opcionalmente, un catálogo de ejemplo.
 *
 * Uso:
 *   npm run db:seed              → usa DATABASE_URL de .env (desarrollo)
 *   npm run db:seed:prod         → usa DATABASE_URL de .env.rds (AWS RDS)
 *
 * Variables:
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD        primer administrador
 *   SEED_ADMIN2_EMAIL / SEED_ADMIN2_PASSWORD      segundo administrador
 *   SEED_ADMIN_RESET_PASSWORD=true                aplica las contraseñas del .env a administradores que ya existen
 *   SEED_SAMPLE_CATALOG=true                      carga el catálogo de ejemplo (no lo uses en producción)
 *
 * Es idempotente: no duplica administradores ni perfumes que ya existan.
 */
import argon2 from "argon2";
import { Pool } from "pg";
import { PasswordPolicy } from "../src/core/application/services/PasswordPolicy";
import { createPoolConfig } from "../src/infrastructure/persistence/postgres/poolConfig";

type SeedPerfume = {
  slug: string;
  name: string;
  house: string;
  category: "NICHO" | "DISENADOR" | "ARABE";
  gender: "HOMBRE" | "MUJER" | "UNISEX";
  concentration: string;
  color: string;
  featured?: boolean;
  description: string;
  notes: [string, string, string];
  presentations: [number, "ORIGINAL" | "REPLICA_1_1", number][];
};

const CATALOG: SeedPerfume[] = [
  { slug: "creed-aventus", name: "Aventus", house: "Creed", category: "NICHO", gender: "HOMBRE", concentration: "EAU_DE_PARFUM", color: "#c9b38a", featured: true, description: "Afrutado y ahumado. Piña jugosa sobre abedul y almizcle.", notes: ["Piña, bergamota, grosella negra", "Abedul, pachulí, jazmín", "Almizcle, musgo de roble, ámbar gris"], presentations: [[50, "ORIGINAL", 980000], [100, "ORIGINAL", 1650000], [100, "REPLICA_1_1", 190000]] },
  { slug: "mfk-baccarat-rouge-540", name: "Baccarat Rouge 540", house: "Maison Francis Kurkdjian", category: "NICHO", gender: "UNISEX", concentration: "EAU_DE_PARFUM", color: "#c4544a", featured: true, description: "Ambarado y luminoso, con estela de algodón de azúcar y madera.", notes: ["Azafrán, jazmín", "Ámbar gris, cedro", "Resina de abeto"], presentations: [[70, "ORIGINAL", 1450000], [100, "REPLICA_1_1", 220000]] },
  { slug: "dior-sauvage", name: "Sauvage", house: "Dior", category: "DISENADOR", gender: "HOMBRE", concentration: "EAU_DE_PARFUM", color: "#3b5b8c", featured: true, description: "Fresco y especiado, con ambroxan que dura todo el día.", notes: ["Bergamota de Calabria, pimienta", "Lavanda, anís estrellado", "Vainilla, ambroxan"], presentations: [[60, "ORIGINAL", 480000], [100, "ORIGINAL", 620000], [100, "REPLICA_1_1", 160000]] },
  { slug: "ysl-libre", name: "Libre", house: "Yves Saint Laurent", category: "DISENADOR", gender: "MUJER", concentration: "EAU_DE_PARFUM", color: "#d9a65a", description: "Lavanda francesa y flor de azahar sobre vainilla.", notes: ["Lavanda, mandarina", "Flor de azahar, jazmín", "Vainilla de Madagascar, almizcle"], presentations: [[50, "ORIGINAL", 520000], [90, "ORIGINAL", 690000]] },
  { slug: "lattafa-khamrah", name: "Khamrah", house: "Lattafa", category: "ARABE", gender: "UNISEX", concentration: "EAU_DE_PARFUM", color: "#8a4a1f", featured: true, description: "Dátiles, canela y praliné sobre vainilla. Cálido y de gran duración.", notes: ["Canela, nuez moscada, bergamota", "Dátiles, praliné, tuberosa", "Vainilla, haba tonka, mirra"], presentations: [[100, "ORIGINAL", 210000]] },
  { slug: "lattafa-yara", name: "Yara", house: "Lattafa", category: "ARABE", gender: "MUJER", concentration: "EAU_DE_PARFUM", color: "#e8a7b4", description: "Cremoso y tropical, con orquídea y vainilla.", notes: ["Orquídea, heliotropo, mandarina", "Acorde gourmand, frutas tropicales", "Vainilla, almizcle, sándalo"], presentations: [[100, "ORIGINAL", 160000]] },
];

/** Mismos parámetros que Argon2PasswordHasher de la aplicación, para que el login verifique el hash. */
const ARGON2_OPTIONS = { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

async function seedAdmins(db: Pool) {
  const resetPasswords = process.env.SEED_ADMIN_RESET_PASSWORD === "true";
  const admins = [
    { label: "SEED_ADMIN", email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD },
    { label: "SEED_ADMIN2", email: process.env.SEED_ADMIN2_EMAIL, password: process.env.SEED_ADMIN2_PASSWORD },
  ];

  for (const admin of admins) {
    const email = admin.email?.trim().toLowerCase();
    const password = admin.password;
    if (!email || !password) {
      console.warn(`${admin.label}_EMAIL o ${admin.label}_PASSWORD no están definidos en el .env: se omite ese administrador.`);
      continue;
    }
    // Falla antes de tocar la base si la contraseña no cumple la política del panel.
    try {
      PasswordPolicy.assertStrong(password);
    } catch {
      throw new Error(`${admin.label}_PASSWORD no cumple la política: mínimo ${PasswordPolicy.MIN_LENGTH} caracteres, con mayúsculas, minúsculas y números.`);
    }

    const { rows } = await db.query<{ id: string }>("SELECT id FROM users WHERE email = $1", [email]);
    if (rows.length === 0) {
      const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);
      await db.query("INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'ADMIN')", [email, passwordHash]);
      console.log(`Administrador creado: ${email}. Cambia la contraseña y activa la verificación en dos pasos al entrar.`);
    } else if (resetPasswords) {
      const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);
      await db.query(
        "UPDATE users SET password_hash = $2, failed_login_count = 0, locked_until = NULL, updated_at = now() WHERE email = $1",
        [email, passwordHash],
      );
      console.log(`Contraseña de ${email} actualizada desde el .env (intentos fallidos y bloqueo reiniciados).`);
    } else {
      console.log(`El administrador ${email} ya existe. Para aplicar la contraseña del .env usa SEED_ADMIN_RESET_PASSWORD=true.`);
    }
  }
}

async function seedCatalog(db: Pool) {
  let created = 0;
  for (const p of CATALOG) {
    const { rowCount } = await db.query("SELECT 1 FROM perfumes WHERE slug = $1", [p.slug]);
    if (rowCount) continue;

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO perfumes (slug, name, house, category, gender, concentration, description, notes_top, notes_heart, notes_base, color, featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [p.slug, p.name, p.house, p.category, p.gender, p.concentration, p.description, p.notes[0], p.notes[1], p.notes[2], p.color, p.featured ?? false],
      );
      for (const [ml, type, priceCop] of p.presentations) {
        await client.query("INSERT INTO presentations (perfume_id, ml, type, price_cop) VALUES ($1, $2, $3, $4)", [rows[0]!.id, ml, type, priceCop]);
      }
      await client.query("COMMIT");
      created++;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  console.log(`Catálogo de ejemplo: ${created} perfumes nuevos (de ${CATALOG.length} en total).`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL no está definida. Revisa el archivo .env que usas.");

  const db = new Pool(createPoolConfig(databaseUrl));
  try {
    await seedAdmins(db);
    if (process.env.SEED_SAMPLE_CATALOG === "true") {
      await seedCatalog(db);
    } else {
      console.log("Catálogo de ejemplo omitido (SEED_SAMPLE_CATALOG no es true).");
    }
  } finally {
    await db.end();
  }
}

main().catch((error: unknown) => {
  console.error("Error en el seed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
