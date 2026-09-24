import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArtworkDetail } from "@/components/artwork/ArtworkDetail";
import { isFavorite } from "@/lib/favorites";
import { getArtwork, getArtworksByArtist } from "@/lib/museum";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  /**
   * Générique, à rebours de la fiche publique qui nomme l'œuvre : celle-ci ne
   * sera jamais partagée ni indexée. Calculer un titre par œuvre coûterait un
   * appel à l'API pour un onglet que personne d'autre ne verra.
   */
  title: "Une œuvre de ma collection",
};

interface ArtworkPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * La même fiche d'œuvre, atteinte depuis SA collection.
 *
 * Cliquer sur une toile depuis « Ma collection » menait à `/collection/...` —
 * une adresse qui dit « le catalogue du musée » — et le lien de retour ramenait
 * donc dans le catalogue entier. On perdait sa place à chaque œuvre consultée.
 *
 * Le prix est assumé : la même œuvre a deux adresses, et celle-ci n'est pas
 * partageable puisque tout `/compte` est gardé. `/collection/[slug]` reste
 * l'adresse canonique. Aucun contenu n'est dupliqué pour autant, les deux routes
 * rendent le même `ArtworkDetail`.
 *
 * Une œuvre qu'on n'a pas mise de côté n'est pas une erreur : elle existe, elle
 * n'est simplement pas ici, donc on renvoie vers sa fiche publique. C'est le cas
 * qu'on rencontre en retirant l'œuvre depuis cette page puis en rechargeant.
 *
 * Page dynamique, forcément : elle lit la session et la base.
 */
export default async function AccountArtworkPage({ params }: ArtworkPageProps) {
  const { slug } = await params;

  /* En parallèle : deux serveurs distincts, et `requireUser` doit de toute façon
     avoir répondu avant la vérification des favoris. */
  const [user, artwork] = await Promise.all([requireUser(), getArtwork(slug)]);

  if (!artwork) notFound();

  if (!(await isFavorite(user.id, slug))) redirect(`/collection/${slug}`);

  /* Les suggestions sont cherchées dans le catalogue, pas dans les favoris : ne
     proposer que des œuvres déjà mises de côté ferait tourner en rond. */
  const sameArtist = await getArtworksByArtist(artwork.artist, artwork.slug);

  return (
    <ArtworkDetail
      artwork={artwork}
      backHref="/compte/collection"
      backLabel="Retour à ma collection"
      sameArtist={sameArtist}
    />
  );
}
