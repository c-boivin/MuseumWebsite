import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArtworkDetail } from "@/components/artwork/ArtworkDetail";
import { isFavorite } from "@/lib/favorites";
import { getArtwork, getArtworksByArtist } from "@/lib/museum";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  /**
   * Un titre GÉNÉRIQUE, à rebours de la fiche publique qui nomme l'œuvre.
   *
   * Celle-ci ne sera jamais partagée ni indexée — le layout de `/compte` la
   * met en `noindex`, et un visiteur qui suivrait le lien serait renvoyé vers
   * la connexion. Calculer un titre par œuvre ici coûterait un appel à l'API
   * pour un onglet que personne d'autre ne verra. La fiche publique, elle,
   * garde ses métadonnées complètes : c'est elle, l'adresse à partager.
   */
  title: "Une œuvre de ma collection",
};

interface ArtworkPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * La même fiche d'œuvre, atteinte depuis SA collection.
 *
 * ── POURQUOI UNE SECONDE ADRESSE POUR LA MÊME ŒUVRE ──
 * Cliquer sur une toile depuis « Ma collection » menait à `/collection/mona-lisa`
 * — une adresse qui dit « le catalogue du musée » — et le lien de retour
 * ramenait donc dans le catalogue entier, pas dans sa propre collection. On
 * perdait sa place à chaque œuvre consultée. L'URL suit maintenant le parcours
 * qu'on emprunte réellement.
 *
 * ── LE PRIX, ASSUMÉ ──
 * La même œuvre a deux adresses. Celle-ci n'est PAS partageable : un destinataire
 * qui l'ouvre tombe sur la connexion, puisque tout `/compte` est gardé. C'est
 * `/collection/[slug]` qui reste l'adresse canonique, la seule pré-générée et la
 * seule qui porte les métadonnées de partage. Aucun contenu n'est dupliqué pour
 * autant : les deux routes rendent le même `artwork/ArtworkDetail`, et ne
 * diffèrent que par ce qu'elles vérifient avant et par leur lien de retour.
 *
 * ── UNE ŒUVRE QU'ON N'A PAS MISE DE CÔTÉ N'EST PAS UNE ERREUR ──
 * Elle existe, elle n'est simplement pas ici : on renvoie donc vers sa fiche
 * publique plutôt que d'afficher une 404. C'est le cas qu'on rencontre en
 * retirant l'œuvre de sa collection depuis cette page même, puis en rechargeant —
 * un cul-de-sac y serait incompréhensible. La 404, elle, reste réservée à ce qui
 * n'existe nulle part.
 *
 * Page dynamique, forcément : elle lit la session et la base. C'est sans
 * conséquence pour le reste du site — `/collection` et les 39 fiches publiques
 * gardent leur pré-génération.
 */
export default async function AccountArtworkPage({ params }: ArtworkPageProps) {
  const { slug } = await params;

  /* En parallèle : l'API du musée et Neon sont deux serveurs distincts, et
     `requireUser` doit de toute façon avoir répondu avant la vérification des
     favoris — c'est la seule dépendance de l'enchaînement. */
  const [user, artwork] = await Promise.all([requireUser(), getArtwork(slug)]);

  if (!artwork) notFound();

  if (!(await isFavorite(user.id, slug))) redirect(`/collection/${slug}`);

  /* Les mêmes suggestions que sur la fiche publique : elles sont cherchées dans
     le CATALOGUE, pas dans les favoris. Ne proposer que des œuvres déjà mises de
     côté ferait tourner le visiteur en rond — une suggestion sert justement à
     sortir de sa propre collection. Leurs liens pointent d'ailleurs vers
     `/collection`, voir `artwork/ArtworkByArtist`. */
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
