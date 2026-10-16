import "server-only";
import { container } from "@/infrastructure/di/Container";
import { RequestContext } from "../RequestContext";
import { AdminController } from "./AdminController";
import { AuthController } from "./AuthController";
import { CatalogController } from "./CatalogController";
import { StorefrontController } from "./StorefrontController";

/**
 * Fábrica de controladores: los construye una sola vez con sus dependencias del contenedor.
 * Las rutas de /app/api solo importan desde aquí.
 */
class Controllers {
  private cache: { auth?: AuthController; catalog?: CatalogController; admin?: AdminController; storefront?: StorefrontController } = {};

  private get context() {
    return new RequestContext(container().accessTokenCodec);
  }

  get auth(): AuthController {
    const c = container();
    return (this.cache.auth ??= new AuthController(
      this.context,
      c.login,
      c.refreshSession,
      c.logout,
      c.currentUser,
      c.beginTotpSetup,
      c.confirmTotpSetup,
      c.changePassword,
    ));
  }

  get catalog(): CatalogController {
    const c = container();
    return (this.cache.catalog ??= new CatalogController(c.listPerfumes, c.getPerfume, c.getStoreSettings));
  }

  get admin(): AdminController {
    const c = container();
    return (this.cache.admin ??= new AdminController(
      this.context,
      c.authorization,
      c.createPerfume,
      c.updatePerfume,
      c.deletePerfume,
      c.requestImageUpload,
      c.updateStoreSettings,
      c.listAuditLog,
      c.localFileStorage,
    ));
  }

  get storefront(): StorefrontController {
    const c = container();
    return (this.cache.storefront ??= new StorefrontController(this.context, c.placeOrder, c.askAssistant));
  }
}

export const controllers = new Controllers();
