import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/presentation/ui/components/admin/LoginForm";

export const metadata: Metadata = { title: "Acceso administrativo", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && /^\/admin(\/[\w\-/]*)?$/.test(next) ? next : "/admin";
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="grid w-full max-w-[880px] overflow-hidden rounded-[20px] border border-line bg-ink-2 md:grid-cols-[1fr_1.1fr]">
        <aside className="flex flex-col gap-5 border-b border-line bg-[radial-gradient(80%_60%_at_30%_20%,rgba(var(--accent-rgb),.18),transparent_70%)] bg-ink-3 p-8 md:border-b-0 md:border-r">
          <div className="logo">
            <b>PRESTIGE</b>
            <span>PERFUMERÍA</span>
          </div>
          <div>
            <div className="eyebrow">Área restringida</div>
            <h1 className="mt-2.5 text-4xl leading-[1.05]">
              Panel de <em className="text-accent">administración</em>
            </h1>
          </div>
          <ul className="hidden list-none gap-3 p-0 text-[13px] text-muted md:grid">
          </ul>
          <Link href="/" className="note mt-auto w-fit underline-offset-4 hover:text-accent hover:underline">
            ← Volver a la tienda
          </Link>
        </aside>
        <div className="p-8">
          <LoginForm next={safeNext} />
        </div>
      </div>
    </main>
  );
}
