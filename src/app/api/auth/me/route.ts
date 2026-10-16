import type { NextRequest } from "next/server";
import { controllers } from "@/presentation/http/controllers";

export const dynamic = "force-dynamic";

export const GET = (req: NextRequest) => controllers.auth.me(req);
