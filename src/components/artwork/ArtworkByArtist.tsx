import { ArtworkGrid } from "@/components/artwork/ArtworkGrid";
import { TransitionLink as Link } from "@/components/motion/TransitionLink";
import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import type { ArtworkPreview } from "@/types/artwork";

interface ArtworkByArtistProps {
  /** Les autres œuvres du peintre, celle qu'on regarde déjà exclue. */
  artworks: ArtworkPreview[];
  /** Nom du peintre, pour le nommer sous le titre. */
  artist: string;
}

/**
 * « Du même artiste » — la seule sortie d'une fiche qui ne soit pas un retour en
 * arrière.
 *
 * Le bloc s'est d'abord appelé « Œuvres similaires » et rapprochait les œuvres
 * par un score. Il remplissait les 39 fiches, au prix d'un titre qui
 * n'engageait à rien : devant trois toiles, le visiteur ne savait pas ce qui les
 * reliait. Le critère est donc unique et le titre le nomme — c'est aussi la
 * question qu'on se pose réellement devant une toile.
 *
 * Absent sur 26 fiches sur 39, et c'est le prix : six artistes seulement ont
 * plus d'une œuvre au catalogue. Rien vaut mieux qu'un rapprochement que la page
 * ne sait pas justifier.
 *
 * `ArtworkGrid` est reprise sans variante : une suggestion doit se reconnaître
 * comme une œuvre du catalogue, pas comme un encart de recommandation. La grille
 * reste à trois colonnes, donc les cartes gardent leur largeur habituelle au lieu
 * de s'étirer.
 *
 * `basePath` reste à sa valeur par défaut, même depuis l'espace compte : une
 * œuvre proposée ici n'est pas forcément dans la collection du visiteur, et une
 * adresse en `/compte/collection/…` mènerait à une redirection vers la fiche
 * publique. Autant y aller directement.
 */
export function ArtworkByArtist({ artworks, artist }: ArtworkByArtistProps) {
  /* Le cas le plus fréquent du catalogue. La garde est ici plutôt que dans la
     page appelante pour qu'aucune des deux routes ne puisse l'oublier. */
  if (artworks.length === 0) return null;

  return (
    <Section>
      <div className="flex items-end justify-between gap-8">
        <div className="space-y-3">
          <p className="eyebrow text-ink-mute">Poursuivre la visite</p>
          <Heading as="h2">Du même artiste</Heading>
        </div>

        <Link
          href="/collection"
          className="whitespace-nowrap text-ink-mute text-sm underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
        >
          Toute la collection →
        </Link>
      </div>

      {/* Le titre annonce le lien, cette ligne dit de qui il s'agit : sans elle
          il faudrait redescendre lire le cartel des cartes pour retrouver le nom
          qu'on vient de quitter. */}
      <p className="mt-6 max-w-reading text-ink-soft text-lead">
        {artworks.length > 1
          ? `Les autres œuvres de ${artist} exposées au musée.`
          : `L'autre œuvre de ${artist} exposée au musée.`}
      </p>

      {/* `priorityCount={0}` : la grille est en bas de page. Les charger en
          priorité volerait de la bande passante à l'œuvre qu'on est venu voir. */}
      <ArtworkGrid artworks={artworks} priorityCount={0} className="mt-16" />
    </Section>
  );
}
