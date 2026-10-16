import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findHelpPage } from "@/presentation/ui/content/helpPages";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = findHelpPage((await params).slug);
  return { title: page?.title ?? "Ayuda" };
}

export default async function HelpPage({ params }: Props) {
  const page = findHelpPage((await params).slug);
  if (!page) notFound();

  return (
    <article className="wrap py-16">
      <Link href="/" className="note no-underline hover:text-fg">
        ← Volver a la tienda
      </Link>
      <div className="eyebrow mt-8">{page.group}</div>
      <h1 className="mb-10 mt-3 text-[clamp(36px,5vw,60px)] leading-[1.02]">{page.title}</h1>
      <div className="grid max-w-[64ch] gap-8">
        {page.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mb-2 text-2xl">{s.heading}</h2>
            {s.paragraphs?.map((p) => (
              <p key={p} className="text-muted">
                {p}
              </p>
            ))}
            {s.list && (
              <ul className="grid list-disc gap-1.5 pl-5 text-muted">
                {s.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
