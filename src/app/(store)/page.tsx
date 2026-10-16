import { Catalog } from "@/presentation/ui/components/store/catalog/Catalog";
import { Hero } from "@/presentation/ui/components/store/hero/Hero";
import { HouseCards } from "@/presentation/ui/components/store/HouseCards";
import { PerfumeMarquee } from "@/presentation/ui/components/store/PerfumeMarquee";
import { ServicePromise } from "@/presentation/ui/components/store/ServicePromise";
import { loadCatalog } from "@/presentation/server/storeData";

export default async function HomePage() {
  const perfumes = await loadCatalog();
  // Destacados que marca el administrador; si ninguno está marcado, muestra el catálogo completo.
  const highlighted = perfumes.filter((perfume) => perfume.featured);
  return (
    <>
      <Hero perfumeCount={perfumes.length} />
      <PerfumeMarquee perfumes={highlighted.length > 0 ? highlighted : perfumes} />
      <HouseCards />
      <Catalog perfumes={perfumes} />
      <ServicePromise />
    </>
  );
}
