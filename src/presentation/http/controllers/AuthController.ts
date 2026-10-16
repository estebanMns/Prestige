import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import type { ChangePasswordUseCase } from "@/core/application/use-cases/auth/ChangePasswordUseCase";
import type { GetCurrentUserUseCase } from "@/core/application/use-cases/auth/GetCurrentUserUseCase";
import type { LoginUseCase } from "@/core/application/use-cases/auth/LoginUseCase";
import type { LogoutUseCase } from "@/core/application/use-cases/auth/LogoutUseCase";
import type { RefreshSessionUseCase } from "@/core/application/use-cases/auth/RefreshSessionUseCase";
import type { BeginTotpSetupUseCase, ConfirmTotpSetupUseCase } from "@/core/application/use-cases/auth/TotpSetupUseCases";
import { UnauthenticatedError } from "@/core/domain/shared/DomainError";
import type { RequestContext } from "../RequestContext";
import { SessionCookies } from "../SessionCookies";
import { changePasswordSchema, loginSchema, totpConfirmSchema } from "../schemas";
import { BaseController } from "./BaseController";

export class AuthController extends BaseController {
  constructor(
    private readonly context: RequestContext,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly currentUserUseCase: GetCurrentUserUseCase,
    private readonly beginTotpUseCase: BeginTotpSetupUseCase,
    private readonly confirmTotpUseCase: ConfirmTotpSetupUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {
    super();
  }

  login = (request: NextRequest) =>
    this.handle(async () => {
      const input = await this.body(request, loginSchema);
      const session = await this.loginUseCase.execute({ ...input, ip: this.context.clientIp(request) });
      return SessionCookies.write(this.ok({ expiresAt: session.accessTokenExpiresAt.toISOString() }), session);
    });

  /** Renovación desde el cliente (fetch). */
  refresh = async (request: NextRequest) => {
    const response = await this.handle(async () => {
      const session = await this.refreshUseCase.execute({ refreshToken: this.context.refreshToken(request) ?? "" });
      return SessionCookies.write(this.ok({ expiresAt: session.accessTokenExpiresAt.toISOString() }), session);
    });
    return response.status === 401 ? SessionCookies.clear(response) : response;
  };

  /** Renovación por redirección: el middleware envía aquí las páginas del panel con el access token vencido. */
  refreshAndRedirect = (request: NextRequest) =>
    this.handle(async () => {
      const next = AuthController.safeNext(request.nextUrl.searchParams.get("next"));
      try {
        const session = await this.refreshUseCase.execute({ refreshToken: this.context.refreshToken(request) ?? "" });
        return SessionCookies.write(NextResponse.redirect(new URL(next, request.url)), session);
      } catch {
        const login = new URL("/admin/login", request.url);
        login.searchParams.set("next", next);
        return SessionCookies.clear(NextResponse.redirect(login));
      }
    });

  logout = (request: NextRequest) =>
    this.handle(async () => {
      await this.logoutUseCase.execute({ refreshToken: this.context.refreshToken(request) });
      return SessionCookies.clear(this.noContent());
    });

  me = (request: NextRequest) =>
    this.handle(async () => {
      const actor = await this.requireActor(request);
      return this.ok(await this.currentUserUseCase.execute({ actor }));
    });

  beginTotp = (request: NextRequest) =>
    this.handle(async () => {
      const actor = await this.requireActor(request);
      const { secret, otpauthUri } = await this.beginTotpUseCase.execute({ actor });
      const qrDataUrl = await QRCode.toDataURL(otpauthUri, { margin: 1, width: 240 });
      return this.ok({ secret, qrDataUrl });
    });

  confirmTotp = (request: NextRequest) =>
    this.handle(async () => {
      const actor = await this.requireActor(request);
      const { code } = await this.body(request, totpConfirmSchema);
      await this.confirmTotpUseCase.execute({ actor, code });
      return this.noContent();
    });

  changePassword = (request: NextRequest) =>
    this.handle(async () => {
      const actor = await this.requireActor(request);
      const input = await this.body(request, changePasswordSchema);
      await this.changePasswordUseCase.execute({ actor, ...input });
      return SessionCookies.clear(this.noContent());
    });

  private async requireActor(request: NextRequest) {
    const actor = await this.context.actor(request);
    if (!actor) throw new UnauthenticatedError();
    return actor;
  }

  /** Solo permite redirecciones internas del panel (evita redirecciones abiertas a otros sitios). */
  static safeNext(next: string | null): string {
    return next && /^\/admin(\/[\w\-/]*)?$/.test(next) ? next : "/admin";
  }
}
