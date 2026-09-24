import type { Metadata } from "next";
import { Instrument_Serif, Outfit } from "next/font/google";
import { FavoritesSync } from "@/components/account/FavoritesSync";
import { SessionSync } from "@/components/account/SessionSync";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Cursor } from "@/components/motion/Cursor";
import { PageTransition } from "@/components/motion/PageTransition";
import { Preloader } from "@/components/motion/Preloader";
import { ScrollMemoryReset } from "@/components/motion/ScrollMemoryReset";
import { SilentArrival } from "@/components/motion/SilentArrival";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { site } from "@/data/site";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

/**
 * next/font télécharge les polices au build et les sert depuis notre domaine :
 * pas de requête vers Google au chargement, et aucun décalage de mise en page
 * quand la police arrive.
 */
const sans = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

/* Instrument Serif plutôt qu'un didone, et l'essai est noté ici parce qu'il a
   l'air d'un choix de goût sans en être un. Bodoni Moda a été branchée puis
   retirée : son axe de taille optique pousse le contraste au maximum aux grands
   corps, et au palier `display` (5rem) les déliés tombent à l'épaisseur d'un
   cheveu — l'accroche de chaque page, donc le pire endroit où fragiliser un
   titre. */
const display = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  /**
   * Sans elle, Next laisse les URL relatives telles quelles : l'image de partage
   * sortait en `/opengraph-image` et les canoniques en `/collection`, des
   * chemins qu'un réseau social ne sait pas résoudre. Résolution du domaine et
   * replis : `lib/site-url.ts`.
   */
  metadataBase: new URL(siteUrl),

  /** Le `%s` du template est remplacé par le titre de chaque page. */
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,

  /* Pas de `alternates.canonical` ici, et c'est le piège du fichier : les
     métadonnées d'un layout sont héritées par toutes les pages qui ne les
     redéfinissent pas. Une canonique à la racine ferait déclarer à chaque page
     qu'elle n'est qu'une variante de l'accueil, et les 39 fiches
     disparaîtraient de l'index. Chaque page publique déclare la sienne. */

  openGraph: {
    title: site.name,
    description: site.description,
    siteName: site.name,
    url: "/",
    locale: "fr_FR",
    type: "website",
  },

  /* Le titre, la description et l'image sont repris de l'Open Graph par Next :
     seul le format de carte n'a pas d'équivalent. */
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* Pas de `data-scroll-behavior="smooth"` : cet attribut sert à neutraliser
       le `scroll-behavior: smooth` du CSS le temps d'une navigation, et le site
       n'en a plus — c'est Lenis qui amortit le défilement, en laissant les sauts
       programmés instantanés. Si le CSS revenait, il faudrait le remettre ; Next
       le signale dans la console.

       `min-h-svh` sur le <body> plutôt que le couple `h-full` / `min-h-full` :
       la feuille de Lenis force `height: auto` sur <html> et elle gagne, n'étant
       dans aucune couche. Un `min-height: 100%` se serait résolu contre une
       hauteur indéfinie, et le Footer serait remonté au milieu de l'écran.

       `suppressHydrationWarning` : le script du preloader pose
       `data-intro-done` sur cette balise pendant l'analyse du document, donc
       avant React — le serveur a rendu un <html> sans l'attribut, le navigateur
       en a un avec. L'écart est voulu et React ne le corrige pas, ce qui est
       exactement ce qu'on veut.

       L'attribut ne porte que sur un niveau : un vrai décalage d'hydratation
       dans une page continuera d'être signalé. Ne pas le recopier plus bas pour
       faire taire un autre avertissement — ailleurs, il masquerait un bug. */
    <html
      lang="fr"
      className={`${sans.variable} ${display.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-svh flex-col font-sans">
        {/* Permet à un utilisateur au clavier de sauter la navigation. */}
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Aller au contenu
        </a>

        {/* Avant {children}, pour que son effet parte avant celui des TextReveal
            de la page qui arrive. Ne rend aucun DOM. */}
        <ScrollMemoryReset />

        {/* Adoucit les deux navigations qui échappent au panneau de transition,
            faute de passer par un lien : la connexion et la déconnexion. */}
        <SilentArrival />

        {/* L'ordre est celui de la dépendance : `SessionSync` prévient le
            navigateur qu'une connexion vient d'avoir lieu sur le serveur, et
            `FavoritesSync` attend cet identifiant pour remplir le cache.

            Ils sont ici parce qu'aucun des composants qui en dépendent n'est
            l'ancêtre des autres : le header, les cartes et l'espace compte n'ont
            aucun parent commun sous le root layout. */}
        <SessionSync />
        <FavoritesSync />

        {/* Lenis est en mode `root` : il prend la main sur le scroll du document
            et ne rend aucun conteneur, la colonne flex du <body> n'est donc pas
            modifiée. Les deux panneaux ci-dessous restent en dehors, ils sont
            `fixed` et ne défilent pas. */}
        <SmoothScroll>
          <Header />
          <main id="contenu" className="flex-1">
            {children}
          </main>
          <Footer />
        </SmoothScroll>

        {/* Montés ici et non dans un `template.tsx` : en Next 16, un template ne
            se remonte que si son propre segment change, donc pas entre
            /collection et /collection/[slug]. Détail dans PageTransition.

            Étant dans le root layout ils ne sont jamais démontés, ce qui fait
            que le preloader ne se rejoue pas d'une page à l'autre et que le
            panneau survit à la navigation qu'il recouvre. */}
        <PageTransition />
        <Preloader />

        {/* En dernier, et l'ordre compte : il porte z-200, donc au-dessus des
            deux panneaux. Monté dans le root layout comme eux, sinon il
            réapparaîtrait à la position 0,0 à chaque navigation. */}
        <Cursor />
      </body>
    </html>
  );
}
