import type { Actor } from "../../../domain/auth/Actor";
import { UnauthenticatedError } from "../../../domain/shared/DomainError";
import { ROLE_LABELS, RolePolicy, type Permission, type Role } from "../../../domain/user/Role";
import type { UserRepository } from "../../ports/repositories";
import type { UseCase } from "../../ports/UseCase";

export interface CurrentUserDTO {
  id: string;
  email: string;
  role: Role;
  roleLabel: string;
  totpEnabled: boolean;
  lastLoginAt: string | null;
  permissions: Permission[];
}

export class GetCurrentUserUseCase implements UseCase<{ actor: Actor }, CurrentUserDTO> {
  constructor(private readonly users: UserRepository) {}

  async execute({ actor }: { actor: Actor }): Promise<CurrentUserDTO> {
    const user = await this.users.findById(actor.userId);
    if (!user) throw new UnauthenticatedError();
    return {
      id: user.id,
      email: user.email.value,
      role: user.role,
      roleLabel: ROLE_LABELS[user.role],
      totpEnabled: user.totpEnabled,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      permissions: RolePolicy.permissionsOf(user.role),
    };
  }
}
