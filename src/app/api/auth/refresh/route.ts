import type { NextRequest } from "next/server";
import { controllers } from "@/presentation/http/controllers";

export const dynamic = "force-dynamic";

export const POST = (req: NextRequest) => controllers.auth.refresh(req);
/** Usado por el middleware para renovar la sesión al navegar por el panel. */
export const GET = (req: NextRequest) => controllers.auth.refreshAndRedirect(req);
