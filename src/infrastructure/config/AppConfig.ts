import "server-only";
import { z } from "zod";

/**
 * Configuración validada al arrancar. Si falta una variable obligatoria o tiene un formato inválido,
 * la aplicación falla de inmediato con un mensaje claro en lugar de fallar más tarde en producción.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  DATABASE_SSL_CA_FILE: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET debe tener al menos 32 caracteres"),
  JWT_ISSUER: z.string().default("perfumeria-prestige"),
  JWT_AUDIENCE: z.string().default("prestige-admin"),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),

  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(10).default(5),
  LOGIN_LOCK_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
  TOTP_ISSUER: z.string().default("Perfumería Prestige"),

  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_PUBLIC_BASE_URL: z.string().optional(),

  XAI_API_KEY: z.string().optional(),
  XAI_MODEL: z.string().default("grok-4.7"),

  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-haiku-5-5"),
});

export type AppConfig = z.infer<typeof schema>;

let cached: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Configuración inválida. Revisa tu archivo .env:\n${details}`);
  }
  if (parsed.data.STORAGE_DRIVER === "s3" && !parsed.data.S3_BUCKET) {
    throw new Error("Configuración inválida: S3_BUCKET es obligatorio cuando STORAGE_DRIVER=s3.");
  }
  cached = parsed.data;
  return cached;
}
