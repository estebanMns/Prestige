import type { NextRequest } from "next/server";
import { controllers } from "@/presentation/http/controllers";

export const dynamic = "force-dynamic";

export const PUT = (req: NextRequest) => controllers.admin.localUpload(req);
