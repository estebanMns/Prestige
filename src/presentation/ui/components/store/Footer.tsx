import Link from "next/link";
import type { StoreSettingsProps } from "@/core/domain/settings/StoreSettings";
import { PhoneNumber } from "@/core/domain/shared/PhoneNumber";
import { HELP_PAGES } from "../../content/helpPages";
import { ChatIcon, ClockIcon, MailIcon, PinIcon } from "../common/Icons";

const DEFAULT_ABOUT =
  "Perfumería Prestige nació de una obsesión: que cada persona encuentre la fragancia que la representa. Seleccionamos casas de nicho, grandes marcas de diseñador y la nueva ola árabe, y las ofrecemos en presentación original o en versión 1.1 para que el precio no sea un obstáculo.";

/** Pie de página: sobre nosotros, tienda, ayuda, contacto, medios de pago y legales. */
export function Footer({ settings, perfumeCount }: { settings: StoreSettingsProps; perfumeCount: number }) {
  const whatsapp = settings.whatsapp ? PhoneNumber.create(settings.whatsapp) : null;
  const socials = (
    [
      ["Instagram", settings.instagram],
      ["TikTok", settings.tiktok],
      ["Facebook", settings.facebook],
    ] as const
  ).filter(([, url]) => url);

  return (
    <footer className="border-t border-line pb-24 text-[13.5px] text-muted" id="nosotros">
      <div className="wrap">
        <div className="grid items-end gap-6 border-b border-line pb-14 pt-16 md:grid-cols-[1.1fr_1fr] md:gap-12">
          <div>
            <div className="eyebrow">Sobre nosotros</div>
            <h2 className="mt-3 text-[clamp(32px,4vw,52px)] leading-[1.04] text-fg">
              Perfumería que se elige <em className="text-accent">con la nariz</em>, no con la etiqueta
            </h2>
          </div>
          <div>
            <p className="mb-3.5 max-w-[58ch]">{settings.about || DEFAULT_ABOUT}</p>
            <p className="mb-5">Cada pedido lo acompaña un asesor real por WhatsApp, desde la recomendación hasta la entrega.</p>
            <dl className="grid grid-cols-3 rounded-[14px] border border-line">
              {[
                [String(perfumeCount || "—"), "fragancias"],
                ["3", "familias"],
                ["24 h", "respuesta del asesor"],
              ].map(([v, l], i) => (
                <div key={l} className={`p-4 ${i < 2 ? "border-r border-line" : ""}`}>
                  <dd className="m-0 font-display text-2xl text-fg">{v}</dd>
                  <dt className="text-xs">{l}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="grid gap-10 border-b border-line py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr]">
          <div>
            <div className="logo">
              <b>PRESTIGE</b>
              <span>PERFUMERÍA</span>
            </div>
            <p className="my-4 max-w-[34ch]">Originales sellados y versiones 1.1 de alta fidelidad, con envío a toda Colombia.</p>
            <div className="flex flex-wrap gap-2">
              {socials.length ? (
                socials.map(([name, url]) => (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[var(--line-strong)] px-3 py-1.5 text-xs text-fg no-underline hover:border-accent hover:text-accent">
                    {name}
                  </a>
                ))
              ) : (
                <span className="note">Síguenos en redes: pronto</span>
              )}
            </div>
          </div>
          <FooterColumn title="Tienda">
            <li><Link href="/#coleccion" className="no-underline hover:text-fg">Toda la colección</Link></li>
            <li><Link href="/#familias" className="no-underline hover:text-fg">Nicho, diseñador y árabes</Link></li>
          </FooterColumn>
          <FooterColumn title="Ayuda">
            {HELP_PAGES.filter((p) => p.group === "Ayuda").map((p) => (
              <li key={p.slug}>
                <Link href={`/ayuda/${p.slug}`} className="no-underline hover:text-fg">
                  {p.title}
                </Link>
              </li>
            ))}
          </FooterColumn>
          <FooterColumn title="Contacto">
            <ContactItem icon={<ChatIcon />} label="WhatsApp">
              {whatsapp ? (
                <a href={`https://wa.me/${whatsapp.digits}`} target="_blank" rel="noopener noreferrer" className="text-fg no-underline">
                  {whatsapp.format()}
                </a>
              ) : (
                "Escríbenos desde el pedido"
              )}
            </ContactItem>
            <ContactItem icon={<MailIcon />} label="Correo">{settings.email || "—"}</ContactItem>
            <ContactItem icon={<PinIcon />} label="Tienda">{settings.address || "Tienda en línea · Envíos a toda Colombia"}</ContactItem>
            <ContactItem icon={<ClockIcon />} label="Horario">{settings.hours || "Lun a sáb · 9:00 a. m. – 7:00 p. m."}</ContactItem>
          </FooterColumn>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-6">
          <span className="eyebrow text-muted">Medios de pago</span>
          <div className="flex flex-wrap gap-2">
            {["Transferencia bancaria", "Nequi", "Daviplata"].map((m) => (
              <span key={m} className="mono rounded-lg border border-line px-2.5 py-1.5 text-[11px] text-fg">
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-6 text-xs">
          <span>© {new Date().getFullYear()} Perfumería Prestige. Precios en pesos colombianos (COP), IVA incluido.</span>
          <nav className="flex flex-wrap gap-4" aria-label="Legal">
            {HELP_PAGES.filter((p) => p.group === "Legal").map((p) => (
              <Link key={p.slug} href={`/ayuda/${p.slug}`} className="no-underline hover:text-fg">
                {p.title}
              </Link>
            ))}
            <Link href="/admin/login" className="no-underline hover:text-fg">
              Acceso administradores
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">{title}</h4>
      <ul className="m-0 grid list-none gap-2.5 p-0">{children}</ul>
    </div>
  );
}

function ContactItem({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[18px_1fr] gap-2.5 [&>svg]:mt-[3px] [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-accent">
      {icon}
      <span>
        {label}
        <br />
        <span className="break-words text-fg">{children}</span>
      </span>
    </li>
  );
}
