import { randomBytes, randomUUID } from "node:crypto";
import { Perfume, type PerfumeDraft } from "@/core/domain/perfume/Perfume";
import { Email } from "@/core/domain/shared/Email";
import { User } from "@/core/domain/user/User";
import type { Role } from "@/core/domain/user/Role";

/** Credenciales de prueba nuevas en cada ejecución: no hay correos ni contraseñas fijas en el código. */
export const TEST_ADMIN = {
  email: `admin-${randomUUID()}@test.invalid`,
  password: `P-${randomBytes(18).toString("base64url")}9`,
};

export function draft(overrides: Partial<PerfumeDraft> = {}): PerfumeDraft {
  return {
    name: "Sauvage",
    house: "Dior",
    category: "DISENADOR",
    gender: "HOMBRE",
    concentration: "EAU_DE_PARFUM",
    description: "Fresco y especiado.",
    notes: { top: "Bergamota", heart: "Lavanda", base: "Ambroxan" },
    presentations: [
      { ml: 100, type: "ORIGINAL", priceCop: 620000 },
      { ml: 60, type: "ORIGINAL", priceCop: 480000 },
      { ml: 100, type: "REPLICA_1_1", priceCop: 160000 },
    ],
    imageKey: null,
    color: "#3b5b8c",
    featured: false,
    ...overrides,
  };
}

export function perfume(id = "11111111-1111-4111-8111-111111111111", overrides: Partial<PerfumeDraft> = {}): Perfume {
  return Perfume.create(id, "dior-sauvage", draft(overrides), new Date("2026-10-01T00:00:00Z"));
}

export function user(role: Role = "ADMIN", id = "user-1"): User {
  return User.create(id, Email.create(TEST_ADMIN.email), `hashed:${TEST_ADMIN.password}`, role);
}
