import type { Actor } from "../../../domain/auth/Actor";
import { UnauthenticatedError, ValidationError } from "../../../domain/shared/DomainError";
import type { AuditLogRepository, UserRepository } from "../../ports/repositories";
import type { Clock, TotpService } from "../../ports/services";
import type { UseCase } from "../../ports/UseCase";

/** Paso 1 del doble factor: genera un secreto y la URI para escanear el código QR. */
export class BeginTotpSetupUseCase implements UseCase<{ actor: Actor }, { secret: string; otpauthUri: string }> {
  constructor(
    private readonly users: UserRepository,
    private readonly totp: TotpService,
  ) {}

  async execute({ actor }: { actor: Actor }) {
    const user = await this.users.findById(actor.userId);
    if (!user) throw new UnauthenticatedError();
    const secret = this.totp.generateSecret();
    user.prepareTotp(secret);
    await this.users.save(user);
    return { secret, otpauthUri: this.totp.keyUri(user.email.value, secret) };
  }
}

/** Paso 2: el usuario confirma con un código de su aplicación y el doble factor queda activo. */
export class ConfirmTotpSetupUseCase implements UseCase<{ actor: Actor; code: string }, void> {
  constructor(
    private readonly users: UserRepository,
    private readonly totp: TotpService,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ actor, code }: { actor: Actor; code: string }): Promise<void> {
    const user = await this.users.findById(actor.userId);
    if (!user) throw new UnauthenticatedError();
    if (!user.totpSecret) throw new ValidationError("Primero genera el código QR.", "code");
    if (!this.totp.verify(code, user.totpSecret)) throw new ValidationError("El código no es correcto. Revisa la hora de tu celular e inténtalo de nuevo.", "code");
    user.confirmTotp();
    await this.users.save(user);
    await this.audit.record({ actorId: user.id, action: "auth.totp_enabled", entity: "user", entityId: user.id, at: this.clock.now() });
  }
}
