import "server-only";
import { PerfumePresenter } from "@/core/application/dto/PerfumeDTO";
import type { ChatAssistant, FileStorage } from "@/core/application/ports/services";
import { AuthorizationService } from "@/core/application/services/AuthorizationService";
import { SessionIssuer } from "@/core/application/services/SessionIssuer";
import { WhatsAppOrderMessage } from "@/core/application/services/WhatsAppOrderMessage";
import { ListAuditLogUseCase } from "@/core/application/use-cases/audit/ListAuditLogUseCase";
import { ChangePasswordUseCase } from "@/core/application/use-cases/auth/ChangePasswordUseCase";
import { GetCurrentUserUseCase } from "@/core/application/use-cases/auth/GetCurrentUserUseCase";
import { LoginUseCase } from "@/core/application/use-cases/auth/LoginUseCase";
import { LogoutUseCase } from "@/core/application/use-cases/auth/LogoutUseCase";
import { RefreshSessionUseCase } from "@/core/application/use-cases/auth/RefreshSessionUseCase";
import { BeginTotpSetupUseCase, ConfirmTotpSetupUseCase } from "@/core/application/use-cases/auth/TotpSetupUseCases";
import { AskAssistantUseCase } from "@/core/application/use-cases/chat/AskAssistantUseCase";
import { PlaceOrderUseCase } from "@/core/application/use-cases/orders/PlaceOrderUseCase";
import { GetPerfumeUseCase, ListPerfumesUseCase } from "@/core/application/use-cases/perfumes/CatalogQueries";
import {
  CreatePerfumeUseCase,
  DeletePerfumeUseCase,
  UpdatePerfumeUseCase,
} from "@/core/application/use-cases/perfumes/ManagePerfumeUseCases";
import { RequestImageUploadUseCase } from "@/core/application/use-cases/perfumes/RequestImageUploadUseCase";
import { GetStoreSettingsUseCase, UpdateStoreSettingsUseCase } from "@/core/application/use-cases/settings/StoreSettingsUseCases";
import { AnthropicChatAssistant } from "../ai/AnthropicChatAssistant";
import { GrokChatAssistant } from "../ai/GrokChatAssistant";
import { KeywordChatAssistant } from "../ai/KeywordChatAssistant";
import { loadConfig, type AppConfig } from "../config/AppConfig";
import { PgAuditLogRepository } from "../persistence/postgres/PgAuditLogRepository";
import { getPool } from "../persistence/postgres/PostgresClientProvider";
import { PgPerfumeRepository } from "../persistence/postgres/PgPerfumeRepository";
import { PgRefreshTokenRepository } from "../persistence/postgres/PgRefreshTokenRepository";
import { PgStoreSettingsRepository } from "../persistence/postgres/PgStoreSettingsRepository";
import { PgUserRepository } from "../persistence/postgres/PgUserRepository";
import { Argon2PasswordHasher } from "../security/Argon2PasswordHasher";
import { CryptoOpaqueTokenGenerator } from "../security/CryptoOpaqueTokenGenerator";
import { InMemoryRateLimiter } from "../security/InMemoryRateLimiter";
import { JoseAccessTokenService } from "../security/JoseAccessTokenService";
import { AccessTokenCodec } from "../security/jwt/AccessTokenCodec";
import { OtplibTotpService } from "../security/OtplibTotpService";
import { LocalFileStorage } from "../storage/LocalFileStorage";
import { S3FileStorage } from "../storage/S3FileStorage";
import { CryptoIdGenerator, SystemClock } from "../system/SystemServices";

/**
 * Raíz de composición (inyección de dependencias manual).
 * Es el ÚNICO lugar que conoce las implementaciones concretas: aquí se conectan los puertos
 * del núcleo con PostgreSQL (pg), Argon2, jose, S3, etc. Cada dependencia se crea una sola vez (lazy).
 */
export class Container {
  static readonly STORE_NAME = "Perfumería Prestige";
  private readonly instances = new Map<string, unknown>();

  private single<T>(key: string, factory: () => T): T {
    if (!this.instances.has(key)) this.instances.set(key, factory());
    return this.instances.get(key) as T;
  }

  // ── Configuración y servicios base ─────────────────────────
  get config(): AppConfig {
    return this.single("config", loadConfig);
  }
  get clock() {
    return this.single("clock", () => new SystemClock());
  }
  get ids() {
    return this.single("ids", () => new CryptoIdGenerator());
  }
  private get db() {
    return getPool();
  }

  // ── Repositorios ───────────────────────────────────────────
  get perfumeRepository() {
    return this.single("perfumeRepo", () => new PgPerfumeRepository(this.db));
  }
  get userRepository() {
    return this.single("userRepo", () => new PgUserRepository(this.db));
  }
  get refreshTokenRepository() {
    return this.single("refreshRepo", () => new PgRefreshTokenRepository(this.db));
  }
  get auditRepository() {
    return this.single("auditRepo", () => new PgAuditLogRepository(this.db));
  }
  get settingsRepository() {
    return this.single("settingsRepo", () => new PgStoreSettingsRepository(this.db));
  }

  // ── Seguridad ──────────────────────────────────────────────
  get accessTokenCodec() {
    return this.single(
      "jwtCodec",
      () =>
        new AccessTokenCodec({
          secret: this.config.JWT_ACCESS_SECRET,
          issuer: this.config.JWT_ISSUER,
          audience: this.config.JWT_AUDIENCE,
          ttlSeconds: this.config.JWT_ACCESS_TTL_SECONDS,
        }),
    );
  }
  get accessTokenService() {
    return this.single("accessTokens", () => new JoseAccessTokenService(this.accessTokenCodec, this.clock));
  }
  get opaqueTokens() {
    return this.single("opaqueTokens", () => new CryptoOpaqueTokenGenerator());
  }
  get passwordHasher() {
    return this.single("hasher", () => new Argon2PasswordHasher());
  }
  get totpService() {
    return this.single("totp", () => new OtplibTotpService(this.config.TOTP_ISSUER));
  }
  get loginRateLimiter() {
    return this.single("loginLimiter", () => new InMemoryRateLimiter(10, 15 * 60, this.clock));
  }
  get chatRateLimiter() {
    return this.single("chatLimiter", () => new InMemoryRateLimiter(20, 60, this.clock));
  }
  get authorization() {
    return this.single("authz", () => new AuthorizationService());
  }
  get sessionIssuer() {
    return this.single(
      "sessionIssuer",
      () =>
        new SessionIssuer(
          this.accessTokenService,
          this.opaqueTokens,
          this.refreshTokenRepository,
          this.ids,
          this.clock,
          this.config.REFRESH_TOKEN_TTL_DAYS,
        ),
    );
  }

  // ── Almacenamiento e IA ────────────────────────────────────
  get fileStorage(): FileStorage {
    return this.single<FileStorage>("storage", () =>
      this.config.STORAGE_DRIVER === "s3"
        ? new S3FileStorage(this.config.S3_BUCKET!, this.config.S3_REGION, this.config.S3_PUBLIC_BASE_URL ?? "")
        : new LocalFileStorage(),
    );
  }
  get localFileStorage(): LocalFileStorage | null {
    return this.fileStorage instanceof LocalFileStorage ? this.fileStorage : null;
  }
  /** Prioridad: Grok (XAI_API_KEY) → Claude (ANTHROPIC_API_KEY) → búsqueda por palabras clave. */
  get chatAssistant(): ChatAssistant {
    return this.single<ChatAssistant>("assistant", () => {
      if (this.config.XAI_API_KEY) return new GrokChatAssistant(this.config.XAI_API_KEY, this.config.XAI_MODEL);
      if (this.config.ANTHROPIC_API_KEY) return new AnthropicChatAssistant(this.config.ANTHROPIC_API_KEY, this.config.ANTHROPIC_MODEL);
      return new KeywordChatAssistant();
    });
  }
  get perfumePresenter() {
    return this.single("presenter", () => new PerfumePresenter(this.fileStorage));
  }

  // ── Casos de uso: autenticación ────────────────────────────
  get login() {
    return this.single(
      "login",
      () =>
        new LoginUseCase(
          this.userRepository,
          this.passwordHasher,
          this.totpService,
          this.sessionIssuer,
          this.loginRateLimiter,
          this.auditRepository,
          this.clock,
          { maxAttempts: this.config.LOGIN_MAX_ATTEMPTS, lockMinutes: this.config.LOGIN_LOCK_MINUTES },
        ),
    );
  }
  get refreshSession() {
    return this.single(
      "refresh",
      () => new RefreshSessionUseCase(this.refreshTokenRepository, this.userRepository, this.opaqueTokens, this.sessionIssuer, this.auditRepository, this.clock),
    );
  }
  get logout() {
    return this.single("logout", () => new LogoutUseCase(this.refreshTokenRepository, this.opaqueTokens, this.clock));
  }
  get currentUser() {
    return this.single("currentUser", () => new GetCurrentUserUseCase(this.userRepository));
  }
  get beginTotpSetup() {
    return this.single("beginTotp", () => new BeginTotpSetupUseCase(this.userRepository, this.totpService));
  }
  get confirmTotpSetup() {
    return this.single("confirmTotp", () => new ConfirmTotpSetupUseCase(this.userRepository, this.totpService, this.auditRepository, this.clock));
  }
  get changePassword() {
    return this.single(
      "changePassword",
      () => new ChangePasswordUseCase(this.userRepository, this.passwordHasher, this.refreshTokenRepository, this.auditRepository, this.clock),
    );
  }

  // ── Casos de uso: catálogo ─────────────────────────────────
  get listPerfumes() {
    return this.single("listPerfumes", () => new ListPerfumesUseCase(this.perfumeRepository, this.perfumePresenter));
  }
  get getPerfume() {
    return this.single("getPerfume", () => new GetPerfumeUseCase(this.perfumeRepository, this.perfumePresenter));
  }
  get createPerfume() {
    return this.single(
      "createPerfume",
      () => new CreatePerfumeUseCase(this.perfumeRepository, this.authorization, this.perfumePresenter, this.auditRepository, this.ids, this.clock),
    );
  }
  get updatePerfume() {
    return this.single(
      "updatePerfume",
      () => new UpdatePerfumeUseCase(this.perfumeRepository, this.authorization, this.perfumePresenter, this.fileStorage, this.auditRepository, this.clock),
    );
  }
  get deletePerfume() {
    return this.single(
      "deletePerfume",
      () => new DeletePerfumeUseCase(this.perfumeRepository, this.authorization, this.fileStorage, this.auditRepository, this.clock),
    );
  }
  get requestImageUpload() {
    return this.single("imageUpload", () => new RequestImageUploadUseCase(this.fileStorage, this.authorization, this.ids));
  }

  // ── Casos de uso: pedidos, ajustes, asesor, auditoría ──────
  get placeOrder() {
    return this.single(
      "placeOrder",
      () => new PlaceOrderUseCase(this.perfumeRepository, this.settingsRepository, this.ids, new WhatsAppOrderMessage(Container.STORE_NAME)),
    );
  }
  get getStoreSettings() {
    return this.single("getSettings", () => new GetStoreSettingsUseCase(this.settingsRepository));
  }
  get updateStoreSettings() {
    return this.single(
      "updateSettings",
      () => new UpdateStoreSettingsUseCase(this.settingsRepository, this.authorization, this.auditRepository, this.clock),
    );
  }
  get askAssistant() {
    return this.single(
      "askAssistant",
      () => new AskAssistantUseCase(this.listPerfumes, this.chatAssistant, this.chatRateLimiter, Container.STORE_NAME),
    );
  }
  get listAuditLog() {
    return this.single("auditLog", () => new ListAuditLogUseCase(this.auditRepository, this.authorization));
  }
}

const globalForContainer = globalThis as unknown as { prestigeContainer?: Container };

/** Devuelve el contenedor único del proceso. */
export function container(): Container {
  globalForContainer.prestigeContainer ??= new Container();
  return globalForContainer.prestigeContainer;
}
