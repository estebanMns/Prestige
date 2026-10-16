import { controllers } from "@/presentation/http/controllers";

export const dynamic = "force-dynamic";

export const GET = () => controllers.catalog.settings();
