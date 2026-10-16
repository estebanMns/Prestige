import type { Role } from "../../domain/user/Role";

/* Puertos de servicios técnicos que el núcleo necesita pero no implementa. */

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  uuid(): string;
  /** Identificador corto y legible, para referencias de pedido. */
  shortCode(length: number): string;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}

export interface AccessTokenClaims {
  userId: string;
  email: string;
  role: Role;
}

export interface AccessTokenService {
  sign(claims: AccessTokenClaims): Promise<{ token: string; expiresAt: Date }>;
  verify(token: string): Promise<AccessTokenClaims>;
}

/** Genera refresh tokens opacos (aleatorios) y su hash para guardar en la base de datos. */
export interface OpaqueTokenGenerator {
  generate(): { raw: string; hash: string };
  hash(raw: string): string;
}

export interface TotpService {
  generateSecret(): string;
  keyUri(accountName: string, secret: string): string;
  verify(code: string, secret: string): boolean;
}

export interface RateLimiter {
  /** Consume un intento para la clave dada. Devuelve cuántos segundos esperar si se superó el límite. */
  consume(key: string): Promise<{ allowed: boolean; retryAfterSeconds: number }>;
  reset(key: string): Promise<void>;
}

export interface FileStorage {
  createUploadUrl(key: string, contentType: string): Promise<{ uploadUrl: string; method: "PUT" }>;
  publicUrl(key: string): string;
  delete(key: string): Promise<void>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatAssistant {
  reply(input: { history: ChatMessage[]; catalog: string; storeName: string }): Promise<string>;
}
