import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ScrollMemoryReset } from "@/components/motion/ScrollMemoryReset";
import { site } from "@/data/site";
import "./globals.css";

/**
 * next/font télécharge les polices au build et les sert depuis notre propre
 * domaine : pas de requête vers Google au chargement de la page, et aucun
 * décalage de mise en page quand la police arrive.
 */
const sans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const display = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  /** Le `%s` du template est remplacé par le titre de chaque page. */
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        {/* Permet à un utilisateur au clavier de sauter la navigation. */}
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Aller au contenu
        </a>

        {/* Avant {children}, pour que son effet parte avant celui des TextReveal
            de la page qui arrive — voir le composant, il corrige une navigation
            qui n'arrivait pas en haut de page. Ne rend aucun DOM. */}
        <ScrollMemoryReset />

        <Header />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
