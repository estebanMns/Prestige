"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 md:flex-col" aria-label="Panel">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm no-underline transition ${active ? "bg-[rgba(var(--accent-rgb),.12)] text-accent" : "text-muted hover:text-fg"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
