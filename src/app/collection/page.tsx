import type { Metadata } from "next";
import { Suspense } from "react";
import { ArtworkBrowser } from "@/components/artwork/ArtworkBrowser";
import { ArtworkGridSkeleton } from "@/components/artwork/ArtworkGridSkeleton";
import { TextReveal } from "@/components/motion/TextReveal";
import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { getArtworks } from "@/lib/museum";

export const metadata: Metadata = {
  title: "Collection",
  description:
    "L'ensemble des œuvres exposées : peintures, fresques et estampes, de la Renaissance au surréalisme.",
};

/**
 * Page Collection — la grille complète du catalogue.
 *
 * L'en-tête est statique et part immédiatement ; seule la grille attend l'API,
 * derrière un <Suspense>. L'utilisateur voit donc le titre de la page avant même
 * que les données existent.
 *
 * POURQUOI UN <Suspense> ICI ET PAS UN FICHIER `loading.tsx` — le piège coûte une
 * heure si on ne le connaît pas : un `loading.tsx` placé dans `app/collection/`
 * s'applique à TOUT le sous-arbre, `[slug]` compris. Or une réponse qui a commencé
 * à être streamée est déjà partie avec un statut HTTP 200, et `notFound()` ne peut
 * plus le changer : une œuvre inexistante répondait donc 200 au lieu de 404.
 * En descendant la frontière de streaming ici, la fiche œuvre retrouve son vrai
 * 404 et la liste garde son squelette de chargement. Vérifié avec `next start`.
 */
export default function CollectionPage() {
  return (
    /* `compact`, comme la marge haute des blocs d'accroche des autres pages : le
       site commence alors à la même hauteur partout.

       Mais PAS `height="screen"` ici, contrairement à l'accueil, à la page À
       propos et à la 404. Ces trois-là n'ont rien, ou rien d'essentiel, sous
       leur bloc d'accroche. Ici, ce qui suit le titre EST la page : les 39
       œuvres. Un en-tête plein écran les repousserait intégralement sous la
       ligne de flottaison, et une page de catalogue qui n'affiche aucune œuvre à
       l'arrivée a raté son seul travail. */
    <Section spacing="compact">
      <div className="max-w-reading space-y-6">
        <p className="font-medium text-ink-mute text-xs uppercase tracking-[0.2em]">
          Collection permanente
        </p>
        <TextReveal>
          <Heading as="h1" size="display">
            Toutes les œuvres
          </Heading>
        </TextReveal>
        <p className="text-ink-soft text-lead">
          De la Renaissance italienne au surréalisme. Cherchez une œuvre par son
          titre ou son artiste, ou affinez par siècle et par teinte dominante,
          puis cliquez sur une reproduction pour lire sa notice complète.
        </p>
      </div>

      <Suspense fallback={<ArtworkGridSkeleton className="mt-16" />}>
        <CollectionArtworks />
      </Suspense>
    </Section>
  );
}

/**
 * Partie de la page qui dépend de l'API, isolée dans son propre composant.
 *
 * C'est la condition pour que <Suspense> serve à quelque chose : il ne peut
 * suspendre que ce qu'il contient. Si le `await` restait dans la page, toute la
 * page attendrait, squelette compris.
 *
 * Rendering : le fetch de `lib/museum.ts` porte un `revalidate`, donc cette page
 * est générée au build puis régénérée périodiquement (ISR). Elle ne coûte rien à
 * l'affichage tant que le catalogue ne bouge pas.
 */
async function CollectionArtworks() {
  const { artworks } = await getArtworks();

  if (artworks.length === 0) {
    /* Cas rare mais réel : l'API répond correctement, sans aucune œuvre
       exploitable. Mieux vaut une phrase qu'une page blanche silencieuse. */
    return (
      <p className="mt-16 text-ink-soft">
        Aucune œuvre n&apos;est consultable pour le moment. Revenez d&apos;ici
        quelques instants.
      </p>
    );
  }

  /* Le catalogue entier part au client, qui filtre sur place : 39 œuvres, c'est
     quelques kilo-octets de JSON contre une requête serveur à chaque case
     cochée. Le jour où le catalogue se compte en milliers, c'est ce choix-là
     qu'il faudra revoir — pas l'interface. */
  return <ArtworkBrowser artworks={artworks} />;
}
