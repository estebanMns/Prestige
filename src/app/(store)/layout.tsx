import { Footer } from "@/presentation/ui/components/store/Footer";
import { Header } from "@/presentation/ui/components/store/Header";
import { StoreOverlays } from "@/presentation/ui/components/store/StoreOverlays";
import { loadCatalog, loadStoreSettings } from "@/presentation/server/storeData";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [perfumes, settings] = await Promise.all([loadCatalog(), loadStoreSettings()]);
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer settings={settings} perfumeCount={perfumes.length} />
      <StoreOverlays perfumes={perfumes} />
    </>
  );
}
