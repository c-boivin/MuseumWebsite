import { AboutStatement } from "@/components/sections/AboutStatement";
import { Hero } from "@/components/sections/Hero";
import { Selection } from "@/components/sections/Selection";
import { featuredArtworks } from "@/data/featured-artworks";
import { site } from "@/data/site";
import { getArtworkPreviews, getArtworks } from "@/lib/museum";
import { collectionStats } from "@/lib/stats";

/**
 * Les quatre œuvres de la sélection, dans l'ordre du parcours.
 *
 * Choisies une à une, et non « les quatre premières du catalogue » : l'accueil
 * est une vitrine, et la vitrine d'un musée ne se remplit pas avec le début d'un
 * inventaire.
 *
 * POURQUOI QUATRE et non six. Contrainte de mise en page d'abord : l'index de la
 * section décide à lui seul si le bloc rentre dans un écran, et six lignes l'en
 * faisaient sortir — le raisonnement complet est dans `Selection.tsx`. Mais la
 * sélection y gagne : les deux œuvres retirées étaient l'Impression, soleil
 * levant de Monet et le Bal du moulin de la Galette de Renoir, c'est-à-dire le
 * SEUL doublon de mouvement des six. Quatre œuvres couvrent donc autant de
 * mouvements que six en couvraient.
 *
 * L'ORDRE EST CHRONOLOGIQUE — 1485, 1831, 1889, 1942 — ce qui donne un sens à la
 * numérotation de l'index : 01 à 04 se lisent comme un parcours de salle, pas
 * comme un classement de préférence. Quatre siècles, quatre mouvements, et une
 * œuvre non occidentale.
 *
 * `defaultIndex` (voir plus bas) désigne en revanche La Nuit étoilée, au milieu
 * du parcours : c'est elle qu'on voit à l'arrivée, parce que c'est la plus
 * immédiatement reconnaissable du lot. L'ordre de lecture et l'image d'accroche
 * n'ont pas à être le même choix.
 */
const SELECTION_SLUGS = [
  "the-birth-of-venus",
  "the-great-wave-off-kanagawa",
  "starry-night",
  "nighthawks",
] as const;

/** Rang de `starry-night` dans la liste ci-dessus. */
const SELECTION_DEFAULT = 2;

/**
 * Page d'accueil.
 *
 * Elle n'écrit aucun style : elle assemble des sections et leur passe du
 * contenu. C'est le bon critère pour juger la bibliothèque de composants — si
 * une page doit écrire ses propres classes de mise en page, c'est qu'il manque
 * un composant.
 *
 * SON RYTHME est délibérément inégal : deux blocs d'une hauteur d'écran, clair
 * puis sombre, puis un troisième en hauteur libre qui se termine avant le bas de
 * l'écran. Trois blocs plein écran identiques donnaient trois arrêts
 * interchangeables — on descendait sans jamais savoir où on en était, et rien
 * n'annonçait la fin de la page.
 *
 * DEUX APPELS API, et chacun a sa raison :
 * - la sélection demande nommément six œuvres, pour ne pas télécharger un
 *   catalogue entier afin d'en montrer une poignée ;
 * - les chiffres clés, eux, portent sur l'ENSEMBLE du fonds : ils ne peuvent pas
 *   se calculer sur six œuvres. Les deux appels partent en parallèle, et le même
 *   cache d'une heure les couvre (voir `lib/museum.ts`) : la page reste
 *   pré-générée, un visiteur ne déclenche jamais ces requêtes.
 *
 * Les deux œuvres qui illustrent le Hero et le bloc éditorial sont servies en
 * local depuis `data/featured-artworks.ts` — voir ce fichier pour le pourquoi.
 */
export default async function HomePage() {
  const [selection, catalogue] = await Promise.all([
    getArtworkPreviews(SELECTION_SLUGS),
    getArtworks(),
  ]);

  const stats = collectionStats(catalogue);

  return (
    <>
      <Hero
        eyebrow="Collection permanente"
        title="Six siècles de peinture, une salle à la fois"
        lead={site.description}
        action={{ label: "Découvrir la collection", href: "/collection" }}
        image={featuredArtworks["the-kiss"]}
        height="screen"
      />

      <Selection
        eyebrow="Sélection"
        title="Quatre œuvres pour commencer"
        artworks={selection}
        defaultIndex={SELECTION_DEFAULT}
        /* Le nombre vient du catalogue, comme les chiffres du bloc suivant : un
           « voir les 39 œuvres » écrit en dur deviendrait faux à la première
           œuvre ajoutée à l'API. */
        action={{
          label: `Voir les ${stats.artworkCount} œuvres`,
          href: "/collection",
        }}
      />

      <AboutStatement
        eyebrow="Le musée"
        title="Nos salles suivent les mouvements, pas les frontières."
        paragraphs={[
          "De la Renaissance italienne au surréalisme, le parcours se lit comme une généalogie : chaque salle met une œuvre en vis-à-vis de celles qui l'ont rendue possible. On passe de Vermeer à Van Gogh sans changer d'étage.",
          "Chaque œuvre est documentée par une notice complète — artiste, mouvement, lieu de conservation.",
        ]}
        /* Les trois chiffres sont calculés depuis le catalogue, jamais écrits en
           dur : voir `lib/stats.ts`. Une œuvre ajoutée à l'API les met à jour
           toute seule à la prochaine régénération. */
        figures={[
          { value: String(stats.artworkCount), label: "œuvres au catalogue" },
          {
            value: String(stats.movementCount),
            label: "mouvements représentés",
          },
          ...(stats.centurySpan
            ? [{ value: stats.centurySpan, label: "siècles couverts" }]
            : []),
        ]}
        action={{ label: "En savoir plus sur le musée", href: "/a-propos" }}
        image={featuredArtworks["water-lilies"]}
        imageCaption="Détail — Water Lilies, Claude Monet"
        /* La loupe se justifie ICI et pas ailleurs : chez Monet, la touche EST
           le sujet. Sur une estampe à aplats, grossir ne montrerait rien. */
        lens
      />
    </>
  );
}
