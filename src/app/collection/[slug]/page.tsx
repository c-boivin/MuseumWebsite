import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArtworkDetail } from "@/components/artwork/ArtworkDetail";
import { JsonLd } from "@/components/ui/JsonLd";
import { site } from "@/data/site";
import { getArtwork, getArtworkSlugs, getArtworksByArtist } from "@/lib/museum";
import { toPlainText } from "@/lib/sanitize";
import { artworkJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";

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
    /* LA MÊME FICHE EXISTE SOUS DEUX ADRESSES — ici, et sous
       `/compte/collection/[slug]` quand on l'atteint depuis sa collection. Deux
       URLs pour un contenu identique, c'est le cas d'école du contenu dupliqué.
       L'espace compte est déjà en `noindex` (voir `app/compte/layout.tsx`), donc
       rien n'est cassé aujourd'hui ; la canonique dit en plus laquelle des deux
       fait foi, et survivra à un changement de réglage là-bas. */
    alternates: { canonical: `/collection/${slug}` },
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

/**
 * Fiche publique d'une œuvre — l'adresse canonique, celle qui se partage.
 *
 * Elle ne dessine rien : la mise en page vit dans `artwork/ArtworkDetail`,
 * partagée avec la fiche atteinte depuis l'espace compte
 * (`/compte/collection/[slug]`). Cette page-ci ne garde que ce qui lui est
 * propre — la pré-génération des 39 fiches, les métadonnées de partage, et le
 * retour vers le catalogue du musée.
 */
export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { slug } = await params;
  const artwork = await getArtwork(slug);

  /* L'API répond 404 pour un slug inconnu, `getArtwork` traduit ça en `null`, et
     c'est ICI qu'on décide quoi en faire. `notFound()` interrompt le rendu et
     affiche `app/not-found.tsx` avec un vrai statut HTTP 404 — un message
     d'erreur rendu dans une page 200 tromperait les moteurs de recherche. */
  if (!artwork) notFound();

  /* APRÈS le `notFound()`, et pas en parallèle du `getArtwork` au-dessus : on ne
     connaît le nom du peintre qu'une fois l'œuvre chargée, il n'y a donc rien à
     demander tant qu'elle n'a pas répondu. L'appel est mis en cache une heure
     comme tous les autres, et ne se produit qu'au build pour les 39 fiches. */
  const sameArtist = await getArtworksByArtist(artwork.artist, artwork.slug);

  return (
    <>
      {/* L'œuvre décrite pour les moteurs de recherche — auteur, date,
          mouvement, reproduction — et le chemin qui y mène. Ni l'un ni l'autre
          n'affiche quoi que ce soit. Le fil d'Ariane n'existe QUE dans le
          balisage : à l'écran, le retour vers le catalogue suffit, mais un
          résultat de recherche, lui, arrive sans contexte. */}
      <JsonLd data={artworkJsonLd(artwork)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: site.name, path: "/" },
          { name: "Collection", path: "/collection" },
          { name: artwork.title, path: `/collection/${artwork.slug}` },
        ])}
      />

      <ArtworkDetail
        artwork={artwork}
        backHref="/collection"
        backLabel="Retour à la collection"
        sameArtist={sameArtist}
      />
    </>
  );
}
