import { Entity } from "../shared/Entity";
import type { Email } from "../shared/Email";
import { Permission, RolePolicy, type Role } from "./Role";

export interface UserProps {
  email: Email;
  passwordHash: string;
  role: Role;
  totpSecret: string | null;
  totpEnabled: boolean;
  failedLoginCount: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
}

export interface LockoutPolicy {
  maxAttempts: number;
  lockMinutes: number;
}

/**
 * Usuario del panel (administrador o asesor).
 * Encapsula las reglas de bloqueo por intentos fallidos y la activación del doble factor.
 */
export class User extends Entity<UserProps> {
  static create(id: string, email: Email, passwordHash: string, role: Role): User {
    return new User(id, {
      email,
      passwordHash,
      role,
      totpSecret: null,
      totpEnabled: false,
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: null,
    });
  }

  static restore(id: string, props: UserProps): User {
    return new User(id, props);
  }

  get email(): Email {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get role(): Role {
    return this.props.role;
  }
  get totpSecret(): string | null {
    return this.props.totpSecret;
  }
  get totpEnabled(): boolean {
    return this.props.totpEnabled;
  }
  get failedLoginCount(): number {
    return this.props.failedLoginCount;
  }
  get lockedUntil(): Date | null {
    return this.props.lockedUntil;
  }
  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt;
  }

  isLocked(now: Date): boolean {
    return this.props.lockedUntil !== null && this.props.lockedUntil.getTime() > now.getTime();
  }

  registerFailedLogin(now: Date, policy: LockoutPolicy): void {
    const count = this.props.failedLoginCount + 1;
    if (count >= policy.maxAttempts) {
      this.props.failedLoginCount = 0;
      this.props.lockedUntil = new Date(now.getTime() + policy.lockMinutes * 60_000);
    } else {
      this.props.failedLoginCount = count;
    }
  }

  registerSuccessfulLogin(now: Date): void {
    this.props.failedLoginCount = 0;
    this.props.lockedUntil = null;
    this.props.lastLoginAt = now;
  }

  changePassword(newHash: string): void {
    this.props.passwordHash = newHash;
  }

  /** Guarda un secreto TOTP pendiente de confirmar; el doble factor no queda activo hasta confirmarlo. */
  prepareTotp(secret: string): void {
    this.props.totpSecret = secret;
    this.props.totpEnabled = false;
  }

  confirmTotp(): void {
    if (!this.props.totpSecret) throw new Error("No hay un secreto TOTP pendiente de confirmar.");
    this.props.totpEnabled = true;
  }

  can(permission: Permission): boolean {
    return RolePolicy.allows(this.props.role, permission);
  }
}
