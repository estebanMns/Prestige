import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, DM_Mono, Manrope } from "next/font/google";
import { ThemeScript } from "@/presentation/ui/components/theme/ThemeScript";
import "./globals.css";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-bodoni", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Perfumería Prestige", template: "%s · Perfumería Prestige" },
  description: "Perfumes de nicho, diseñador y árabes, originales y 1.1. Asesoría personalizada y pedidos por WhatsApp.",
  applicationName: "Perfumería Prestige",
  openGraph: { type: "website", locale: "es_CO", siteName: "Perfumería Prestige" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a090d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={`${bodoni.variable} ${manrope.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
