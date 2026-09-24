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
  /* La page se visite aussi avec des filtres dans l'URL, qui n'en changent pas
     le contenu : la canonique désigne l'adresse nue, pour que les variantes ne
     se fassent pas concurrence dans l'index. */
  alternates: { canonical: "/collection" },
};

/**
 * Page Collection — la grille complète du catalogue.
 *
 * L'en-tête est statique et part immédiatement ; seule la grille attend l'API,
 * derrière un <Suspense>.
 *
 * Un <Suspense> ici et pas un fichier `loading.tsx` : celui-ci s'appliquerait à
 * tout le sous-arbre, `[slug]` compris. Or une réponse qui a commencé à être
 * streamée est déjà partie avec un statut 200, et `notFound()` ne peut plus le
 * changer — une œuvre inexistante répondait donc 200 au lieu de 404. En
 * descendant la frontière de streaming ici, la fiche retrouve son vrai 404.
 */
export default function CollectionPage() {
  return (
    /* `compact`, comme la marge haute des autres pages : le site commence à la
       même hauteur partout.

       Mais pas `height="screen"` : ce qui suit le titre EST la page. Un en-tête
       plein écran repousserait les 39 œuvres sous la ligne de flottaison, et une
       page de catalogue qui n'en affiche aucune à l'arrivée a raté son travail.

       C'est la seule page à composer son en-tête à la main — les autres passent
       par <Hero />. C'est pour ça que le corps du titre avait dérivé ici : une
       taille recopiée est une taille qui se désynchronise. */
    <Section spacing="compact">
      <div className="max-w-reading space-y-6">
        <p className="eyebrow text-ink-mute">Collection permanente</p>
        <TextReveal>
          {/* `display`, la taille des titres de <Hero /> : la hauteur du bloc n'a
              rien à voir avec le corps du titre, c'est l'accroche de la page. À
              2.75rem, /collection arrivait avec un titre deux fois plus petit que
              les autres.

              Ce n'est pas « une seule taille par balise » : le <h1> de la fiche
              reste en `title`, parce qu'il titre un cartel, pas une page. */}
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
 * Partie qui dépend de l'API, isolée dans son propre composant : c'est la
 * condition pour que <Suspense> serve à quelque chose, il ne peut suspendre que
 * ce qu'il contient. Avec le `await` dans la page, toute la page attendrait.
 *
 * Le fetch porte un `revalidate`, donc la page est générée au build puis
 * régénérée périodiquement.
 */
async function CollectionArtworks() {
  const { artworks } = await getArtworks();

  if (artworks.length === 0) {
    /* Rare mais réel : l'API répond correctement, sans aucune œuvre
       exploitable. Mieux vaut une phrase qu'une page blanche. */
    return (
      <p className="mt-16 text-ink-soft">
        Aucune œuvre n&apos;est consultable pour le moment. Revenez d&apos;ici
        quelques instants.
      </p>
    );
  }

  /* Le catalogue entier part au client, qui filtre sur place : 39 œuvres, c'est
     quelques kilo-octets contre une requête serveur à chaque case cochée. Le
     jour où le catalogue se compte en milliers, c'est ce choix qu'il faudra
     revoir, pas l'interface. */
  return <ArtworkBrowser artworks={artworks} />;
}
