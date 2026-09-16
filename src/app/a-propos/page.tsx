import type { Metadata } from "next";
import { AboutChapters } from "@/components/sections/AboutChapters";
import { Hero } from "@/components/sections/Hero";
import { about } from "@/data/about";
import { featuredArtworks } from "@/data/featured-artworks";
import { getArtworks } from "@/lib/museum";
import type { ArtworkPreview } from "@/types/artwork";

/**
 * Nombre d'œuvres envoyées à la spirale.
 *
 * Neuf, et c'est un réglage visuel autant qu'une économie. La chaîne de cartes
 * doit tenir ENTIÈRE dans la hauteur de la colonne : c'est à ses deux extrémités
 * que les cartes s'effacent et se voilent, et ce fondu doit avoir lieu à l'écran.
 * 9 cartes espacées de 58px font 522px de chaîne, dont le fondu s'achève à 261px
 * du centre — pour une colonne d'au moins 40rem (640px), soit une soixantaine de
 * pixels de marge en haut comme en bas.
 *
 * En mettre plus ferait dépasser la chaîne et les cartes seraient tranchées net
 * par le bord avant d'avoir commencé à disparaître.
 */
const SPIRAL_ARTWORKS = 9;

/**
 * Métadonnées propres à la page. Le template défini dans le root layout complète
 * automatiquement le titre en « À propos — Musée des Mouvements ».
 */
export const metadata: Metadata = {
  title: "À propos",
  description: about.metaDescription,
};

/**
 * Œuvres de la spirale, et le filet qui empêche l'API de faire tomber la page.
 *
 * Le contenu de cette page est LOCAL : titre, chapeau et chapitres viennent de
 * `data/about.ts`, et l'œuvre d'accroche de `data/featured-artworks.ts`. L'API
 * ne sert plus qu'à alimenter la spirale. Une panne du service externe ne doit
 * donc pas empêcher la page de s'afficher, contrairement à `/collection` dont
 * l'API EST le contenu et qui, elle, a un `error.tsx` pour afficher un message
 * honnête.
 *
 * Sans ce try/catch, la moindre coupure — API en 500, réseau d'entreprise qui
 * inspecte le TLS et fait échouer la vérification du certificat — remontait
 * jusqu'à la racine et emportait toute la page, texte compris. C'est ce qui est
 * arrivé : la page ne faisait aucun appel API avant qu'on y branche les visuels.
 */
async function getSpiralArtworks(): Promise<ArtworkPreview[]> {
  try {
    const { artworks } = await getArtworks({ limit: SPIRAL_ARTWORKS });
    return artworks;
  } catch (error) {
    /* Journalisé côté serveur et non propagé : le visiteur voit une page
       complète et sobre, l'équipe voit la cause dans les logs. */
    console.error("Page À propos : visuels indisponibles", error);
    return [];
  }
}

/**
 * Page À propos.
 *
 * Asynchrone depuis le branchement des visuels. Les appels passent par
 * `lib/museum.ts`, donc profitent du même cache d'une heure que le reste du
 * site — la page reste pré-générée.
 */
export default async function AboutPage() {
  const artworks = await getSpiralArtworks();

  return (
    <>
      {/* `height="screen"` comme sur l'accueil. En hauteur libre, ce bloc faisait
          une fois et demie l'écran — le cadre 4/3 de l'œuvre y ajoutait à lui
          seul plus de 500px — et débordait donc toujours. Contrepartie assumée :
          les chapitres commencent sous la ligne de flottaison, mais un bloc
          tronqué en bas d'écran invite moins à descendre qu'un bloc net. */}
      <Hero
        eyebrow="Le musée"
        title={about.title}
        lead={about.lead}
        /* Même intitulé et même destination que sur l'accueil, volontairement :
           un libellé unique pour une action unique s'apprend une fois. C'est
           aussi la seule sortie de cette page vers le catalogue — sans lui, la
           colonne de texte s'arrêtait sur un chapeau de trois lignes en
           vis-à-vis d'une œuvre pleine hauteur, et le bloc paraissait vide. */
        action={{ label: "Découvrir la collection", href: "/collection" }}
        image={featuredArtworks.sunflowers}
        /* `center` et non le défaut `top` : les Tournesols sont une nature
           morte, son sujet est au MILIEU de la toile — le bouquet et le col du
           vase. Cadrée en haut, la bande ne montrait que les pétales du sommet,
           sans rien qui identifie l'œuvre. */
        imagePosition="center"
        height="screen"
      />

      <AboutChapters chapters={about.chapters} artworks={artworks} />
    </>
  );
}
