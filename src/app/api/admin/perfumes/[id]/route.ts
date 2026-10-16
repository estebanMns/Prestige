import type { NextRequest } from "next/server";
import { controllers } from "@/presentation/http/controllers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export const PUT = async (req: NextRequest, { params }: Params) => controllers.admin.update(req, (await params).id);
export const DELETE = async (req: NextRequest, { params }: Params) => controllers.admin.remove(req, (await params).id);
