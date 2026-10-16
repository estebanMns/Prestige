import type { Actor } from "../../../domain/auth/Actor";
import { UnauthenticatedError, ValidationError } from "../../../domain/shared/DomainError";
import type { AuditLogRepository, RefreshTokenRepository, UserRepository } from "../../ports/repositories";
import type { Clock, PasswordHasher } from "../../ports/services";
import type { UseCase } from "../../ports/UseCase";
import { PasswordPolicy } from "../../services/PasswordPolicy";

export interface ChangePasswordInput {
  actor: Actor;
  currentPassword: string;
  newPassword: string;
}

/** Cambia la contraseña y cierra todas las demás sesiones del usuario. */
export class ChangePasswordUseCase implements UseCase<ChangePasswordInput, void> {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly audit: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ actor, currentPassword, newPassword }: ChangePasswordInput): Promise<void> {
    const user = await this.users.findById(actor.userId);
    if (!user) throw new UnauthenticatedError();
    if (!(await this.hasher.verify(user.passwordHash, currentPassword))) {
      throw new ValidationError("La contraseña actual no es correcta.", "currentPassword");
    }
    PasswordPolicy.assertStrong(newPassword);
    user.changePassword(await this.hasher.hash(newPassword));
    await this.users.save(user);
    const now = this.clock.now();
    await this.refreshTokens.revokeAllForUser(user.id, now);
    await this.audit.record({ actorId: user.id, action: "auth.password_changed", entity: "user", entityId: user.id, at: now });
  }
}
