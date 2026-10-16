import "server-only";
import { cache } from "react";
import { container } from "@/infrastructure/di/Container";

/** Datos de la tienda para los componentes de servidor. `cache` evita consultar dos veces por petición. */
export const loadCatalog = cache(() => container().listPerfumes.execute({}));
export const loadStoreSettings = cache(() => container().getStoreSettings.execute());
