/**
 * Implementaciones en memoria de los puertos. Permiten probar los casos de uso
 * sin base de datos ni servicios externos: la ventaja directa de depender de interfaces.
 */
import type {
  AuditLogRepository,
  PerfumeFilter,
  PerfumeRepository,
  RefreshTokenRepository,
  StoreSettingsRepository,
  UserRepository,
} from "@/core/application/ports/repositories";
import type {
  AccessTokenClaims,
  AccessTokenService,
  Clock,
  FileStorage,
  IdGenerator,
  OpaqueTokenGenerator,
  PasswordHasher,
  RateLimiter,
  TotpService,
} from "@/core/application/ports/services";
import type { AuditEntry } from "@/core/domain/audit/AuditEntry";
import type { RefreshToken } from "@/core/domain/auth/RefreshToken";
import type { Perfume } from "@/core/domain/perfume/Perfume";
import { StoreSettings } from "@/core/domain/settings/StoreSettings";
import type { User } from "@/core/domain/user/User";

export class FixedClock implements Clock {
  constructor(public current = new Date("2026-10-15T12:00:00Z")) {}
  now() {
    return new Date(this.current);
  }
  advanceMinutes(minutes: number) {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}

export class SequentialIds implements IdGenerator {
  private n = 0;
  uuid() {
    this.n += 1;
    return `00000000-0000-4000-8000-${String(this.n).padStart(12, "0")}`;
  }
  shortCode(length: number) {
    return "A".repeat(length);
  }
}

export class InMemoryPerfumes implements PerfumeRepository {
  readonly items = new Map<string, Perfume>();
  async findAll(filter: PerfumeFilter = {}) {
    return [...this.items.values()].filter((p) => !filter.category || p.category === filter.category);
  }
  async findById(id: string) {
    return this.items.get(id) ?? null;
  }
  async findByIds(ids: string[]) {
    return ids.map((id) => this.items.get(id)).filter((p): p is Perfume => Boolean(p));
  }
  async slugExists(slug: string) {
    return [...this.items.values()].some((p) => p.slug === slug);
  }
  async save(perfume: Perfume) {
    this.items.set(perfume.id, perfume);
  }
  async delete(id: string) {
    this.items.delete(id);
  }
}

export class InMemoryUsers implements UserRepository {
  readonly items = new Map<string, User>();
  async findByEmail(email: string) {
    return [...this.items.values()].find((u) => u.email.value === email) ?? null;
  }
  async findById(id: string) {
    return this.items.get(id) ?? null;
  }
  async save(user: User) {
    this.items.set(user.id, user);
  }
}

export class InMemoryRefreshTokens implements RefreshTokenRepository {
  readonly items = new Map<string, RefreshToken>();
  async findByHash(hash: string) {
    return [...this.items.values()].find((t) => t.tokenHash === hash) ?? null;
  }
  async save(token: RefreshToken) {
    this.items.set(token.id, token);
  }
  async revokeFamily(familyId: string, at: Date) {
    for (const t of this.items.values()) if (t.familyId === familyId) t.revoke(at);
  }
  async revokeAllForUser(userId: string, at: Date) {
    for (const t of this.items.values()) if (t.userId === userId) t.revoke(at);
  }
  async hasActiveFamily(familyId: string, now: Date) {
    return [...this.items.values()].some((t) => t.familyId === familyId && !t.revokedAt && t.expiresAt > now);
  }
}

export class InMemoryAudit implements AuditLogRepository {
  readonly entries: AuditEntry[] = [];
  async record(entry: AuditEntry) {
    this.entries.push(entry);
  }
  async latest(limit: number) {
    return this.entries.slice(-limit).reverse();
  }
}

export class InMemorySettings implements StoreSettingsRepository {
  constructor(public settings: StoreSettings = StoreSettings.empty()) {}
  async get() {
    return this.settings;
  }
  async save(settings: StoreSettings) {
    this.settings = settings;
  }
}

/** "Hash" reversible solo para pruebas: nunca usar fuera de los tests. */
export class PlainHasher implements PasswordHasher {
  async hash(plain: string) {
    return `hashed:${plain}`;
  }
  async verify(hash: string, plain: string) {
    return hash === `hashed:${plain}`;
  }
}

export class FakeAccessTokens implements AccessTokenService {
  async sign(claims: AccessTokenClaims) {
    return { token: `access:${claims.userId}`, expiresAt: new Date("2026-10-15T12:15:00Z") };
  }
  async verify(token: string): Promise<AccessTokenClaims> {
    return { userId: token.replace("access:", ""), email: "x@y.co", role: "ADMIN", sessionId: "s1" };
  }
}

export class CountingOpaqueTokens implements OpaqueTokenGenerator {
  private n = 0;
  generate() {
    this.n += 1;
    const raw = `refresh-${this.n}`;
    return { raw, hash: this.hash(raw) };
  }
  hash(raw: string) {
    return `h(${raw})`;
  }
}

export class FakeTotp implements TotpService {
  generateSecret() {
    return "SECRET";
  }
  keyUri(account: string, secret: string) {
    return `otpauth://totp/${account}?secret=${secret}`;
  }
  verify(code: string) {
    return code === "123456";
  }
}

export class UnlimitedRateLimiter implements RateLimiter {
  async consume() {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  async reset() {}
}

export class FakeStorage implements FileStorage {
  readonly deleted: string[] = [];
  async createUploadUrl(key: string) {
    return { uploadUrl: `https://bucket.test/${key}?signed`, method: "PUT" as const };
  }
  publicUrl(key: string) {
    return `https://cdn.test/${key}`;
  }
  async delete(key: string) {
    this.deleted.push(key);
  }
}
