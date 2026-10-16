import { Email } from "../../../domain/shared/Email";
import {
  AccountLockedError,
  InvalidCredentialsError,
  RateLimitedError,
  TotpRequiredError,
  ValidationError,
} from "../../../domain/shared/DomainError";
import type { LockoutPolicy } from "../../../domain/user/User";
import type { AuditLogRepository, UserRepository } from "../../ports/repositories";
import type { Clock, PasswordHasher, RateLimiter, TotpService } from "../../ports/services";
import type { UseCase } from "../../ports/UseCase";
import type { IssuedSession, SessionIssuer } from "../../services/SessionIssuer";

export interface LoginInput {
  email: string;
  password: string;
  totpCode?: string;
  ip: string;
}

/**
 * Inicio de sesión del panel.
 * Orden de comprobaciones: límite por IP → cuenta bloqueada → contraseña → doble factor.
 * Ante cualquier fallo de credenciales responde lo mismo, para no revelar si el correo existe.
 */
export class LoginUseCase implements UseCase<LoginInput, IssuedSession> {
  /** Hash de una contraseña ficticia: iguala el tiempo de respuesta cuando el correo no existe. */
  private dummyHash: Promise<string> | null = null;

  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly totp: TotpService,
    private readonly sessions: SessionIssuer,
    private readonly rateLimiter: RateLimiter,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
    private readonly lockout: LockoutPolicy,
  ) {}

  async execute(input: LoginInput): Promise<IssuedSession> {
    const limit = await this.rateLimiter.consume(`login:${input.ip}`);
    if (!limit.allowed) throw new RateLimitedError(limit.retryAfterSeconds);

    let email: Email;
    try {
      email = Email.create(input.email);
    } catch {
      throw new InvalidCredentialsError();
    }
    if (!input.password) throw new ValidationError("Escribe tu contraseña.", "password");

    const now = this.clock.now();
    const user = await this.users.findByEmail(email.value);

    if (!user) {
      this.dummyHash ??= this.hasher.hash("prestige-timing-equalizer");
      await this.hasher.verify(await this.dummyHash, input.password).catch(() => false);
      throw new InvalidCredentialsError();
    }
    if (user.isLocked(now)) throw new AccountLockedError(user.lockedUntil!);

    const passwordOk = await this.hasher.verify(user.passwordHash, input.password);
    if (!passwordOk) {
      user.registerFailedLogin(now, this.lockout);
      await this.users.save(user);
      await this.audit.record({
        actorId: user.id,
        action: user.isLocked(now) ? "auth.locked" : "auth.login_failed",
        entity: "user",
        entityId: user.id,
        details: { ip: input.ip },
        at: now,
      });
      if (user.isLocked(now)) throw new AccountLockedError(user.lockedUntil!);
      throw new InvalidCredentialsError();
    }

    if (user.totpEnabled) {
      if (!input.totpCode) throw new TotpRequiredError();
      if (!this.totp.verify(input.totpCode, user.totpSecret!)) {
        user.registerFailedLogin(now, this.lockout);
        await this.users.save(user);
        throw new InvalidCredentialsError();
      }
    }

    user.registerSuccessfulLogin(now);
    await this.users.save(user);
    await this.rateLimiter.reset(`login:${input.ip}`);
    await this.audit.record({ actorId: user.id, action: "auth.login", entity: "user", entityId: user.id, details: { ip: input.ip }, at: now });
    return this.sessions.issue(user);
  }
}
