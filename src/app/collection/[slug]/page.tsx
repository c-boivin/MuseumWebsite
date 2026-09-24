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
   * ⚠️ Next 16 : `params` est une promesse. Le changement vient du rendu en
   * streaming — la page peut commencer à s'afficher avant que le routeur ait
   * fini de résoudre l'URL.
   */
  params: Promise<{ slug: string }>;
}

/**
 * Liste les URL à pré-générer au build : sans elle, chaque fiche serait rendue à
 * la première visite. Avec, les 39 pages sortent du build en HTML statique.
 *
 * Un slug absent n'est pas perdu : Next rend la page à la demande, et
 * `notFound()` prend le relais si l'œuvre n'existe pas.
 */
export async function generateStaticParams() {
  const slugs = await getArtworkSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * Sans elles, les 39 fiches se partageraient sous le même titre et la même
 * vignette. L'appel à `getArtwork` n'est pas dupliqué en pratique : React
 * mémoïse les `fetch` identiques d'un même rendu.
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
    /* La même fiche existe sous deux adresses — ici et sous
       `/compte/collection/[slug]`. L'espace compte est déjà en `noindex`, donc
       rien n'est cassé aujourd'hui ; la canonique dit en plus laquelle fait foi,
       et survivra à un changement de réglage là-bas. */
    alternates: { canonical: `/collection/${slug}` },
    openGraph: {
      title: artwork.title,
      description,
      type: "article",
      /* Mieux vaut aucune image qu'une URL cassée dans l'aperçu d'un réseau
         social. */
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
 * partagée avec la fiche de l'espace compte. Cette page ne garde que ce qui lui
 * est propre — la pré-génération, les métadonnées, et le lien de retour.
 */
export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { slug } = await params;
  const artwork = await getArtwork(slug);

  /* `notFound()` interrompt le rendu et affiche `app/not-found.tsx` avec un vrai
     statut 404 — un message d'erreur rendu dans une page 200 tromperait les
     moteurs de recherche. */
  if (!artwork) notFound();

  /* Après le `notFound()` et non en parallèle : on ne connaît le nom du peintre
     qu'une fois l'œuvre chargée. L'appel est mis en cache une heure comme les
     autres, et ne se produit qu'au build pour les 39 fiches. */
  const sameArtist = await getArtworksByArtist(artwork.artist, artwork.slug);

  return (
    <>
      {/* L'œuvre décrite pour les moteurs de recherche, et le chemin qui y mène.
          Le fil d'Ariane n'existe que dans le balisage : à l'écran le lien de
          retour suffit, mais un résultat de recherche arrive sans contexte. */}
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
