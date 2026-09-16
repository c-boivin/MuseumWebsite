import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkMeta } from "@/components/artwork/ArtworkMeta";
import { TextReveal } from "@/components/motion/TextReveal";
import { Frame } from "@/components/ui/Frame";
import { Heading } from "@/components/ui/Heading";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";
import { getArtwork, getArtworkSlugs } from "@/lib/museum";
import { toPlainText } from "@/lib/sanitize";

interface ArtworkPageProps {
  /**
   * ⚠️ Next 16 : `params` est une PROMESSE, il faut l'attendre.
   * Le changement vient du rendu en streaming — la page peut commencer à
   * s'afficher avant que le routeur ait fini de résoudre l'URL.
   */
  params: Promise<{ slug: string }>;
}

/**
 * Liste les URL à pré-générer au build.
 *
 * Sans cette fonction, chaque fiche serait rendue à la première visite. Avec
 * elle, les 39 pages sortent du build en HTML statique : affichage instantané,
 * et le robot de Google trouve un contenu complet. C'est le « SSG » de l'énoncé.
 *
 * Un slug absent de cette liste n'est pas perdu pour autant : Next rend la page
 * à la demande, et `notFound()` prend le relais si l'œuvre n'existe pas.
 */
export async function generateStaticParams() {
  const slugs = await getArtworkSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * Métadonnées propres à chaque œuvre.
 *
 * Indispensable pour le partage : sans ça, les 39 fiches se partageraient toutes
 * sous le même titre et la même vignette. L'appel à `getArtwork` n'est pas
 * dupliqué en pratique — React mémoïse les `fetch` identiques d'un même rendu,
 * donc l'API n'est interrogée qu'une seule fois pour la page.
 */
export async function generateMetadata({
  params,
}: ArtworkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const artwork = await getArtwork(slug);

  if (!artwork) {
    return { title: "Œuvre introuvable" };
  }

  const byline = artwork.artist ? ` — ${artwork.artist}` : "";
  const description = artwork.description
    ? toPlainText(artwork.description)
    : `${artwork.title}${byline}, exposée au musée.`;

  return {
    title: `${artwork.title}${byline}`,
    description,
    openGraph: {
      title: artwork.title,
      description,
      type: "article",
      /* Pas de reproduction exploitable = pas de vignette de partage. Mieux vaut
         aucune image qu'une URL cassée dans l'aperçu d'un réseau social. */
      images: artwork.media
        ? [{ url: artwork.media.src, alt: artwork.media.alt }]
        : undefined,
    },
  };
}

/** Fiche complète d'une œuvre. */
export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { slug } = await params;
  const artwork = await getArtwork(slug);

  /* L'API répond 404 pour un slug inconnu, `getArtwork` traduit ça en `null`, et
     c'est ICI qu'on décide quoi en faire. `notFound()` interrompt le rendu et
     affiche `app/not-found.tsx` avec un vrai statut HTTP 404 — un message
     d'erreur rendu dans une page 200 tromperait les moteurs de recherche. */
  if (!artwork) notFound();

  return (
    /* Une fiche = UN écran, sans scroll. Le cartel d'un musée tient sur un seul
       panneau à côté du tableau : on ne fait pas défiler un mur. `height="screen"`
       borne le bloc à la hauteur utile (l'écran moins le header collant), et
       c'est l'image qui absorbe la place restante — pas l'inverse. */
    <Section
      spacing="compact"
      height="screen"
      /* `max-h-viewport` EN PLUS du `min-h-viewport` qu'apporte
         `height="screen"`, et c'est ce qui rend vraie la promesse du
         commentaire ci-dessus.

         `height="screen"` ne pose qu'une hauteur MINIMALE. Sur la fiche au
         cartel le plus haut du catalogue — La Grande Vague, dont le lieu de
         conservation passe sur deux lignes — rien n'empêchait la colonne de
         droite de dépasser : la section grandissait, la ligne de grille avec
         elle, et la reproduction en `h-full` suivait jusqu'à sortir de l'écran.

         Le plafond ferme la mise en page. La hauteur devient définie de bout en
         bout, donc la grille et ses deux colonnes ne peuvent plus grandir, et
         l'`overflow-y-auto` du cartel se déclenche enfin — il ne pouvait pas
         déborder d'une hauteur qui n'existait pas. Contrepartie assumée : sur
         une fenêtre très basse, c'est le cartel qui défile, pas la page. C'est
         exactement ce que le composant annonçait déjà. */
      className="max-h-viewport"
    >
      <Link
        href="/collection"
        className="shrink-0 text-ink-mute text-sm underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
      >
        ← Retour à la collection
      </Link>

      {/* `flex-1` réclame toute la hauteur restante sous le lien de retour, et
          `min-h-0` autorise cette ligne à rétrécir sous la taille de son contenu
          — sans lui, une grille refuse de passer sous sa hauteur naturelle et
          déborde de l'écran. */}
      <div className="mt-6 grid min-h-0 flex-1 grid-cols-[1.6fr_1fr] gap-16">
        {/* `height="full"` au lieu d'un `ratio` : la hauteur vient de la mise en
            page, l'image s'y inscrit en `contain` sans jamais être rognée. */}
        {/* Équerres de cadrage : la signature graphique du site, reprise du
            monogramme. Leur place est ici plus que partout ailleurs — c'est LA
            reproduction qu'on est venu voir. Voir <Frame /> pour la règle. */}
        <Frame className="min-h-0">
          <Media
            item={artwork.media}
            height="full"
            fit="contain"
            priority
            sizes="60vw"
            fallbackLabel="Aucune reproduction n'est disponible pour cette œuvre."
            className="bg-surface p-8"
          />
        </Frame>

        {/* Le cartel est centré face à l'œuvre. `overflow-y-auto` est un filet :
            sur un écran très bas, il fait défiler la colonne plutôt que la page. */}
        <div className="flex min-h-0 flex-col justify-center gap-6 overflow-y-auto">
          <div className="space-y-3">
            {artwork.movement && (
              <p className="font-medium text-ink-mute text-xs uppercase tracking-[0.2em]">
                {artwork.movement}
              </p>
            )}
            {/* `key` : d'une fiche à l'autre, React réutiliserait l'instance
                et tenterait de patcher un <h1> dont SplitText a remplacé les
                enfants. La clé force un remontage propre — le découpage est
                défait, puis refait sur le nouveau titre. */}
            <TextReveal key={artwork.slug}>
              <Heading as="h1" size="title">
                {artwork.title}
              </Heading>
            </TextReveal>
            <p className="text-ink-soft text-lead">
              {artwork.artist ?? "Artiste inconnu"}
              {artwork.year !== null && `, ${artwork.year}`}
            </p>
          </div>

          <ArtworkMeta artwork={artwork} />
        </div>
      </div>
    </Section>
  );
}
