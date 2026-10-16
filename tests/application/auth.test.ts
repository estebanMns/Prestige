import { beforeEach, describe, expect, it } from "vitest";
import { SessionIssuer } from "@/core/application/services/SessionIssuer";
import { LoginUseCase } from "@/core/application/use-cases/auth/LoginUseCase";
import { RefreshSessionUseCase } from "@/core/application/use-cases/auth/RefreshSessionUseCase";
import {
  AccountLockedError,
  InvalidCredentialsError,
  TotpRequiredError,
  UnauthenticatedError,
} from "@/core/domain/shared/DomainError";
import {
  CountingOpaqueTokens,
  FakeAccessTokens,
  FakeTotp,
  FixedClock,
  InMemoryAudit,
  InMemoryRefreshTokens,
  InMemoryUsers,
  PlainHasher,
  SequentialIds,
  UnlimitedRateLimiter,
} from "../fakes/InMemory";
import { TEST_ADMIN, user } from "../fakes/builders";

function setup() {
  const users = new InMemoryUsers();
  const refreshTokens = new InMemoryRefreshTokens();
  const audit = new InMemoryAudit();
  const clock = new FixedClock();
  const opaque = new CountingOpaqueTokens();
  const sessions = new SessionIssuer(new FakeAccessTokens(), opaque, refreshTokens, new SequentialIds(), clock, 7);
  const login = new LoginUseCase(users, new PlainHasher(), new FakeTotp(), sessions, new UnlimitedRateLimiter(), audit, clock, { maxAttempts: 3, lockMinutes: 15 });
  const refresh = new RefreshSessionUseCase(refreshTokens, users, opaque, sessions, audit, clock);
  return { users, refreshTokens, audit, clock, login, refresh };
}

describe("LoginUseCase", () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(async () => {
    ctx = setup();
    await ctx.users.save(user());
  });

  it("emite access y refresh token con credenciales correctas", async () => {
    const session = await ctx.login.execute({ email: `${TEST_ADMIN.email.toUpperCase()} `, password: TEST_ADMIN.password, ip: "1.1.1.1" });
    expect(session.accessToken).toBe("access:user-1");
    expect(session.refreshToken).toBe("refresh-1");
    expect(ctx.refreshTokens.items.size).toBe(1);
    expect(ctx.audit.entries.at(-1)?.action).toBe("auth.login");
  });

  it("una cuenta solo tiene una sesión activa: el segundo inicio cierra la primera", async () => {
    const first = await ctx.login.execute({ email: TEST_ADMIN.email, password: TEST_ADMIN.password, ip: "1.1.1.1" });
    const second = await ctx.login.execute({ email: TEST_ADMIN.email, password: TEST_ADMIN.password, ip: "2.2.2.2" });

    const tokens = [...ctx.refreshTokens.items.values()];
    const firstFamily = tokens[0]!.familyId;
    const secondFamily = tokens[tokens.length - 1]!.familyId;
    expect(first.refreshToken).not.toBe(second.refreshToken);
    expect(firstFamily).not.toBe(secondFamily);

    // La primera sesión queda cerrada y la segunda sigue activa.
    expect(await ctx.refreshTokens.hasActiveFamily(firstFamily, ctx.clock.now())).toBe(false);
    expect(await ctx.refreshTokens.hasActiveFamily(secondFamily, ctx.clock.now())).toBe(true);
    await expect(ctx.refresh.execute({ refreshToken: first.refreshToken })).rejects.toThrow(UnauthenticatedError);
  });

  it("responde igual si el correo no existe o la contraseña es incorrecta", async () => {
    await expect(ctx.login.execute({ email: `nadie-${TEST_ADMIN.email}`, password: "x", ip: "1" })).rejects.toThrow(InvalidCredentialsError);
    await expect(ctx.login.execute({ email: TEST_ADMIN.email, password: "mala", ip: "1" })).rejects.toThrow(InvalidCredentialsError);
  });

  it("bloquea la cuenta tras varios intentos fallidos", async () => {
    await expect(ctx.login.execute({ email: TEST_ADMIN.email, password: "a", ip: "1" })).rejects.toThrow(InvalidCredentialsError);
    await expect(ctx.login.execute({ email: TEST_ADMIN.email, password: "b", ip: "1" })).rejects.toThrow(InvalidCredentialsError);
    await expect(ctx.login.execute({ email: TEST_ADMIN.email, password: "c", ip: "1" })).rejects.toThrow(AccountLockedError);
    await expect(ctx.login.execute({ email: TEST_ADMIN.email, password: TEST_ADMIN.password, ip: "1" })).rejects.toThrow(AccountLockedError);
    ctx.clock.advanceMinutes(16);
    await expect(ctx.login.execute({ email: TEST_ADMIN.email, password: TEST_ADMIN.password, ip: "1" })).resolves.toBeTruthy();
  });

  it("pide el código TOTP cuando el doble factor está activo", async () => {
    const u = (await ctx.users.findById("user-1"))!;
    u.prepareTotp("SECRET");
    u.confirmTotp();
    await expect(ctx.login.execute({ email: TEST_ADMIN.email, password: TEST_ADMIN.password, ip: "1" })).rejects.toThrow(TotpRequiredError);
    await expect(ctx.login.execute({ email: TEST_ADMIN.email, password: TEST_ADMIN.password, totpCode: "000000", ip: "1" })).rejects.toThrow(InvalidCredentialsError);
    await expect(ctx.login.execute({ email: TEST_ADMIN.email, password: TEST_ADMIN.password, totpCode: "123456", ip: "1" })).resolves.toBeTruthy();
  });
});

describe("RefreshSessionUseCase", () => {
  it("rota el refresh token: el anterior deja de servir", async () => {
    const ctx = setup();
    await ctx.users.save(user());
    const first = await ctx.login.execute({ email: TEST_ADMIN.email, password: TEST_ADMIN.password, ip: "1" });
    const second = await ctx.refresh.execute({ refreshToken: first.refreshToken });
    expect(second.refreshToken).not.toBe(first.refreshToken);
  });

  it("si un token ya usado se reutiliza, revoca toda la sesión (posible robo)", async () => {
    const ctx = setup();
    await ctx.users.save(user());
    const first = await ctx.login.execute({ email: TEST_ADMIN.email, password: TEST_ADMIN.password, ip: "1" });
    const second = await ctx.refresh.execute({ refreshToken: first.refreshToken });

    await expect(ctx.refresh.execute({ refreshToken: first.refreshToken })).rejects.toThrow(UnauthenticatedError);
    await expect(ctx.refresh.execute({ refreshToken: second.refreshToken })).rejects.toThrow(UnauthenticatedError);
    expect(ctx.audit.entries.some((e) => e.action === "auth.token_reuse_detected")).toBe(true);
  });

  it("rechaza tokens vencidos", async () => {
    const ctx = setup();
    await ctx.users.save(user());
    const first = await ctx.login.execute({ email: TEST_ADMIN.email, password: TEST_ADMIN.password, ip: "1" });
    ctx.clock.advanceMinutes(8 * 24 * 60);
    await expect(ctx.refresh.execute({ refreshToken: first.refreshToken })).rejects.toThrow(UnauthenticatedError);
  });
});
