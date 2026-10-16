import type { NextRequest } from "next/server";
import { controllers } from "@/presentation/http/controllers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export const GET = async (req: NextRequest, { params }: Params) => controllers.catalog.detail(req, (await params).id);
