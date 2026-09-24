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
 * next/font télécharge les polices au build et les sert depuis notre propre
 * domaine : pas de requête vers Google au chargement de la page, et aucun
 * décalage de mise en page quand la police arrive.
 */
const sans = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

/* Instrument Serif PLUTÔT QU'UN DIDONE, et l'essai est documenté ici parce
   qu'il a l'air d'un choix de goût sans en être un. Bodoni Moda a été branchée
   puis retirée : son axe de taille optique pousse le contraste au maximum aux
   grands corps, et au palier `display` (5rem) les déliés tombent à l'épaisseur
   d'un cheveu — l'accroche plein écran de chaque page, c'est-à-dire le pire
   endroit où fragiliser un titre. Instrument Serif est un display à faible
   contraste et plus étroit : il tient à 5rem, et il laisse le titre dans la
   largeur pour laquelle les Hero sont dessinés. */
const display = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  /**
   * L'URL de référence du site, et la pièce qui manquait au reste.
   *
   * Sans elle, Next laisse les URLs relatives telles quelles : l'image de
   * partage sortait en `/opengraph-image` et les URLs canoniques en
   * `/collection` — des chemins qu'un réseau social ou un moteur de recherche
   * ne sait pas résoudre, puisqu'il ne lit pas la page depuis notre domaine.
   * Avec elle, Next les complète en absolu, ici et dans toutes les pages.
   * Résolution du domaine et replis : `lib/site-url.ts`.
   */
  metadataBase: new URL(siteUrl),

  /** Le `%s` du template est remplacé par le titre de chaque page. */
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,

  /* PAS DE `alternates.canonical` ICI, et c'est le piège du fichier. Les
     métadonnées d'un layout sont héritées par toutes les pages qui ne les
     redéfinissent pas : une canonique posée à la racine ferait déclarer à
     chaque page du site qu'elle n'est qu'une variante de l'accueil, et les 39
     fiches disparaîtraient de l'index. Chaque page publique déclare la sienne,
     une par une. */

  openGraph: {
    title: site.name,
    description: site.description,
    siteName: site.name,
    url: "/",
    locale: "fr_FR",
    type: "website",
  },

  /* L'aperçu grand format sur X / Twitter. Le titre, la description et l'image
     sont repris de l'Open Graph ci-dessus par Next : seul le format de carte
     n'a pas d'équivalent et doit être déclaré. */
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* PAS de `data-scroll-behavior="smooth"` ici, et ce n'est plus un oubli : cet
       attribut sert à dire à Next de neutraliser le `scroll-behavior: smooth` du
       CSS le temps d'une navigation — sans quoi la remontée en haut de page se
       fait en glissant derrière le panneau de transition. Le site n'a plus de
       `scroll-behavior: smooth` : c'est Lenis qui amortit le défilement
       (`motion/SmoothScroll`), et il laisse les sauts programmés instantanés.
       L'attribut n'aurait donc plus rien à neutraliser. Si le CSS revenait un
       jour, il faudrait le remettre — Next le signale dans la console.

       Hauteurs : `min-h-svh` sur le <body> plutôt que le couple
       `h-full` / `min-h-full` d'avant. La feuille de style de Lenis force
       `height: auto` sur <html> (et elle gagne, n'étant dans aucune couche) :
       un `min-height: 100%` sur le <body> se serait alors résolu contre une
       hauteur indéfinie, c'est-à-dire plus rien — et le Footer serait remonté
       au milieu de l'écran sur les pages courtes. `svh` pour la même raison que
       le token `--spacing-viewport`. */
    /* `suppressHydrationWarning` : LE SCRIPT DU PRELOADER ÉCRIT SUR CETTE
       BALISE AVANT REACT. `SKIP_INTRO_SCRIPT` (voir `motion/Preloader`) pose
       `data-intro-done="1"` pendant l'analyse du document — c'est tout son
       intérêt, il doit passer avant le premier affichage. Le serveur a donc
       rendu un <html> sans cet attribut et le navigateur en a un avec : à
       l'hydratation, React compare et signale l'écart en console.

       L'avertissement est ici un FAUX POSITIF — la différence est voulue, et
       React ne la corrige pas, ce qui est exactement ce qu'on veut : la règle
       CSS qui masque le panneau dépend de cet attribut.

       L'attribut ne porte QUE SUR UN NIVEAU : il tait les écarts d'attributs
       de ce <html>, pas ceux de l'arbre en dessous. Un vrai décalage
       d'hydratation dans une page continuera donc d'être signalé — c'est ce
       qui rend le remède acceptable. Ne pas le recopier plus bas dans l'arbre
       pour faire taire un autre avertissement : ailleurs, il masquerait un
       bug. */
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
            de la page qui arrive — voir le composant, il corrige une navigation
            qui n'arrivait pas en haut de page. Ne rend aucun DOM. */}
        <ScrollMemoryReset />

        {/* Ne rend rien non plus : il adoucit les deux navigations qui échappent
            au panneau de transition, faute de passer par un lien — la connexion,
            qui se termine par un `redirect()` de Server Action, et la
            déconnexion. Sans lui, ce sont les deux seuls endroits du site où la
            page change d'un coup. */}
        <SilentArrival />

        {/* DEUX COMPOSANTS QUI NE RENDENT RIEN, ET L'ORDRE EST CELUI DE LA
            DÉPENDANCE, pas une préférence de mise en page.

            `SessionSync` prévient le navigateur qu'une connexion vient d'avoir
            lieu sur le SERVEUR — sans lui, le header reste sur « Connexion »
            après s'être connecté, jusqu'au prochain rechargement complet.
            `FavoritesSync` attend justement cet identifiant pour remplir le
            cache des favoris, qui permet aux boutons des 39 cartes de savoir
            lesquelles sont déjà mises de côté SANS que la page ait à lire la
            session — ce qui la rendrait dynamique.

            Les deux sont ici parce qu'aucun des composants qui en dépendent
            n'est l'ancêtre des autres : le header, les cartes de la collection
            et l'espace compte n'ont aucun parent commun sous le root layout. */}
        <SessionSync />
        <FavoritesSync />

        {/* DÉFILEMENT AMORTI SUR TOUT LE SITE. `<SmoothScroll>` ne rend aucun
            conteneur — Lenis est en mode `root`, il prend la main sur le scroll
            du document et laisse ses enfants tels quels. La colonne flex du
            <body> n'est donc pas modifiée, et le Header reste un enfant direct.

            Les deux panneaux ci-dessous restent en dehors : ils sont `fixed`,
            ils ne défilent pas. */}
        <SmoothScroll>
          <Header />
          <main id="contenu" className="flex-1">
            {children}
          </main>
          <Footer />
        </SmoothScroll>

        {/* LES DEUX PANNEAUX D'ANIMATION, empilés au-dessus du site. Ils sont
            montés ICI et non dans un `template.tsx` : en Next 16, un template ne
            se remonte QUE si son propre segment change, donc pas entre
            /collection et /collection/[slug] — le parcours principal du site.
            Détail et source dans PageTransition.

            Étant dans le root layout, ils ne sont jamais démontés : c'est ce qui
            fait que le preloader ne se rejoue pas d'une page à l'autre, et que
            le panneau de transition survit à la navigation qu'il recouvre.

            Aucun des deux n'est dans le flux : deux éléments `fixed`, placés
            après le contenu pour ne pas s'insérer dans l'ordre de tabulation. */}
        <PageTransition />
        <Preloader />

        {/* LE CURSEUR PASSE EN DERNIER, ET L'ORDRE COMPTE ICI. Il porte z-200,
            donc au-dessus des deux panneaux — un curseur qui disparaît derrière
            l'intro ou la transition serait perdu au pire moment. Comme eux, il
            est monté dans le root layout : il ne doit pas se remonter d'une page
            à l'autre, sous peine de réapparaître à la position 0,0 à chaque
            navigation. Il ne rend rien de tabulable. */}
        <Cursor />
      </body>
    </html>
  );
}
