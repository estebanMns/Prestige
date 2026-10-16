import type { NextRequest } from "next/server";
import type { GetPerfumeUseCase, ListPerfumesUseCase } from "@/core/application/use-cases/perfumes/CatalogQueries";
import type { GetStoreSettingsUseCase } from "@/core/application/use-cases/settings/StoreSettingsUseCases";
import { catalogFilterSchema } from "../schemas";
import { BaseController } from "./BaseController";

/** Endpoints públicos de solo lectura: catálogo y datos de contacto de la tienda. */
export class CatalogController extends BaseController {
  constructor(
    private readonly listPerfumes: ListPerfumesUseCase,
    private readonly getPerfume: GetPerfumeUseCase,
    private readonly getSettings: GetStoreSettingsUseCase,
  ) {
    super();
  }

  list = (request: NextRequest) =>
    this.handle(async () => {
      const filter = catalogFilterSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
      const perfumes = await this.listPerfumes.execute(filter);
      return this.ok(perfumes, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
    });

  detail = (_request: NextRequest, id: string) => this.handle(async () => this.ok(await this.getPerfume.execute({ id })));

  settings = () => this.handle(async () => this.ok(await this.getSettings.execute()));
}
