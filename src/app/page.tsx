import type { Metadata } from "next";
import { AboutStatement } from "@/components/sections/AboutStatement";
import { Hero } from "@/components/sections/Hero";
import { MuseumFigures } from "@/components/sections/MuseumFigures";
import { Selection } from "@/components/sections/Selection";
import { JsonLd } from "@/components/ui/JsonLd";
import { featuredArtworks } from "@/data/featured-artworks";
import { site } from "@/data/site";
import { getArtworkPreviews, getArtworks } from "@/lib/museum";
import { collectionStats } from "@/lib/stats";
import { museumJsonLd } from "@/lib/structured-data";

/**
 * L'accueil prend le titre et la description du root layout. Seule la canonique
 * est à déclarer, elle ne s'hérite pas — voir `app/layout.tsx`.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Les quatre œuvres de la sélection, choisies une à une : l'accueil est une
 * vitrine, et une vitrine ne se remplit pas avec le début d'un inventaire.
 *
 * Quatre et non six, d'abord par contrainte de mise en page (voir
 * `Selection.tsx`). La sélection y gagne : les deux œuvres retirées étaient le
 * seul doublon de mouvement des six.
 *
 * L'ordre est chronologique, ce qui donne un sens à la numérotation — 01 à 04 se
 * lisent comme un parcours de salle, pas comme un classement.
 */
const SELECTION_SLUGS = [
  "the-birth-of-venus",
  "the-great-wave-off-kanagawa",
  "starry-night",
  "nighthawks",
] as const;

/** Rang de `starry-night` : la plus reconnaissable, donc celle qu'on voit en arrivant. */
const SELECTION_DEFAULT = 2;

/**
 * Page d'accueil.
 *
 * Elle n'écrit aucun style, elle assemble des sections. C'est le bon critère
 * pour juger la bibliothèque de composants : si une page doit écrire ses propres
 * classes de mise en page, c'est qu'il manque un composant.
 *
 * Son rythme est délibérément inégal — un écran plein, un bloc court, un écran
 * plein et sombre, un dernier bloc en hauteur libre. Quatre blocs identiques
 * donneraient quatre arrêts interchangeables.
 *
 * Deux appels API en parallèle : la sélection demande nommément quatre œuvres,
 * les chiffres clés portent sur l'ensemble du fonds et ne peuvent pas se
 * calculer dessus. Le cache d'une heure les couvre, la page reste pré-générée.
 */
export default async function HomePage() {
  const [selection, catalogue] = await Promise.all([
    getArtworkPreviews(SELECTION_SLUGS),
    getArtworks(),
  ]);

  const stats = collectionStats(catalogue);

  return (
    <>
      {/* Description du lieu et non de la page : posée uniquement ici. N'affiche
          rien, voir `lib/structured-data.ts`. */}
      <JsonLd data={museumJsonLd()} />

      <Hero
        eyebrow="Collection permanente"
        title="Six siècles de peinture, une salle à la fois"
        lead={site.description}
        action={{ label: "Découvrir la collection", href: "/collection" }}
        image={featuredArtworks["the-kiss"]}
        height="screen"
      />

      {/* Le seul chemin de l'accueil vers la billetterie : les autres blocs
          mènent à la collection ou au musée. En deuxième position, le bouton est
          à un écran de l'arrivée.

          Il ne prend aucune prop : ses chiffres se dérivent de `data/site.ts` et
          de la grille tarifaire, pas du catalogue — deux séries, deux sources. */}
      <MuseumFigures />

      <Selection
        eyebrow="Sélection"
        title="Quatre œuvres pour commencer"
        artworks={selection}
        defaultIndex={SELECTION_DEFAULT}
        /* Le nombre vient du catalogue : un « voir les 39 œuvres » écrit en dur
           deviendrait faux à la première œuvre ajoutée. */
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
        /* Calculés depuis le catalogue, jamais écrits en dur : voir `lib/stats.ts`. */
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
        /* La loupe se justifie ici : chez Monet la touche EST le sujet. Sur une
           estampe à aplats, grossir ne montrerait rien. */
        lens
      />
    </>
  );
}
