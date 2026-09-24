import type { Metadata } from "next";
import { AboutChapters } from "@/components/sections/AboutChapters";
import { Hero } from "@/components/sections/Hero";
import { about } from "@/data/about";
import { featuredArtworks } from "@/data/featured-artworks";
import { getArtworks } from "@/lib/museum";
import type { ArtworkPreview } from "@/types/artwork";

/**
 * Neuf, et c'est un réglage visuel autant qu'une économie : la chaîne de cartes
 * doit tenir entière dans la colonne, puisque c'est à ses extrémités que les
 * cartes s'effacent. 9 cartes espacées de 58px font 522px, pour une colonne d'au
 * moins 40rem. Au-delà, les cartes seraient tranchées net par le bord avant
 * d'avoir commencé à disparaître.
 */
const SPIRAL_ARTWORKS = 9;

/** Le template du root layout complète le titre en « À propos — … ». */
export const metadata: Metadata = {
  title: "À propos",
  description: about.metaDescription,
  alternates: { canonical: "/a-propos" },
};

/**
 * Le contenu de cette page est local : l'API ne sert qu'à alimenter la spirale.
 * Une panne ne doit donc pas empêcher la page de s'afficher, contrairement à
 * `/collection` dont l'API EST le contenu et qui a un `error.tsx`.
 *
 * Sans ce try/catch, une API en 500 remontait jusqu'à la racine et emportait
 * toute la page, texte compris.
 */
async function getSpiralArtworks(): Promise<ArtworkPreview[]> {
  try {
    const { artworks } = await getArtworks({ limit: SPIRAL_ARTWORKS });
    return artworks;
  } catch (error) {
    /* Journalisé et non propagé : le visiteur voit une page complète et sobre,
       l'équipe voit la cause dans les logs. */
    console.error("Page À propos : visuels indisponibles", error);
    return [];
  }
}

/**
 * Page À propos. Les appels passent par `lib/museum.ts`, donc profitent du même
 * cache d'une heure : la page reste pré-générée.
 */
export default async function AboutPage() {
  const artworks = await getSpiralArtworks();

  return (
    <>
      {/* `height="screen"` comme sur l'accueil : en hauteur libre ce bloc faisait
          une fois et demie l'écran et débordait toujours. Contrepartie assumée,
          les chapitres commencent sous la ligne de flottaison — mais un bloc
          tronqué invite moins à descendre qu'un bloc net. */}
      <Hero
        eyebrow="Le musée"
        title={about.title}
        lead={about.lead}
        /* Même intitulé et même destination que sur l'accueil : un libellé unique
           pour une action unique s'apprend une fois. C'est aussi la seule sortie
           de cette page vers le catalogue. */
        action={{ label: "Découvrir la collection", href: "/collection" }}
        image={featuredArtworks.sunflowers}
        /* `center` et non le défaut `top` : les Tournesols sont une nature morte,
           son sujet est au milieu de la toile. Cadrée en haut, la bande ne
           montrait que les pétales du sommet. */
        imagePosition="center"
        height="screen"
      />

      <AboutChapters chapters={about.chapters} artworks={artworks} />
    </>
  );
}
