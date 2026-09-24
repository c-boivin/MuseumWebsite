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
 * « Du même artiste » — la redirection vers d'autres tableaux demandée par le
 * sujet, et la seule sortie d'une fiche qui ne soit pas un retour en arrière.
 *
 * ── UN SEUL CRITÈRE, ET IL EST ÉCRIT DANS LE TITRE ──
 * Le bloc s'est d'abord appelé « Œuvres similaires » et rapprochait les œuvres
 * par un score — même artiste, même mouvement, même siècle, même teinte. Il
 * remplissait les 39 fiches, au prix d'un titre qui n'engageait à rien : devant
 * trois toiles, le visiteur ne savait pas ce qui les reliait à celle qu'il
 * venait de regarder. Le critère est donc devenu unique et le titre le nomme.
 * C'est aussi la question qu'on se pose réellement devant une toile — qu'est-ce
 * que ce peintre a fait d'autre ?
 *
 * ── LE BLOC EST ABSENT SUR 26 FICHES SUR 39, ET C'EST LE PRIX ──
 * Six artistes seulement ont plus d'une œuvre au catalogue. Les autres fiches se
 * terminent sur la notice. Arbitrage rendu en connaissant le chiffre : rien vaut
 * mieux qu'un rapprochement que la page ne sait pas justifier. Le lien « Toute
 * la collection » de la notice reste, lui, sur toutes les fiches.
 *
 * ── LA GRILLE DU CATALOGUE, TELLE QUELLE ──
 * `ArtworkGrid` et ses cartes sont reprises sans la moindre variante : même
 * cadrage carré, même cartel, même signet de favori. Une suggestion doit se
 * reconnaître comme une œuvre du catalogue, pas comme un encart de
 * recommandation — et le jour où la carte change, elle change ici aussi. La
 * grille reste à trois colonnes : avec une ou deux œuvres, les cartes gardent
 * donc la largeur qu'elles ont partout ailleurs sur le site au lieu de s'étirer
 * pour occuper la ligne.
 *
 * ── LES LIENS POINTENT VERS `/collection`, MÊME DEPUIS L'ESPACE COMPTE ──
 * `basePath` est laissé à sa valeur par défaut. Une œuvre proposée ici n'est
 * justement pas forcément dans la collection du visiteur : lui donner une
 * adresse en `/compte/collection/…` mènerait à la redirection de cette route,
 * qui renvoie sur la fiche publique. Autant y aller directement.
 */
export function ArtworkByArtist({ artworks, artist }: ArtworkByArtistProps) {
  /* Le cas le plus fréquent du catalogue : ce peintre n'a qu'une œuvre ici.
     Pas de titre orphelin au-dessus d'une grille vide — la fiche s'arrête à la
     notice. La garde est ici plutôt que dans la page appelante pour qu'aucune
     des deux routes qui rendent une fiche ne puisse l'oublier. */
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

      {/* Le titre annonce le lien, cette ligne dit DE QUI il s'agit. Sans elle,
          il faudrait redescendre lire le cartel des cartes pour retrouver le nom
          qu'on vient de quitter — et le pluriel se règle sur place plutôt que
          par une seconde phrase à maintenir. */}
      <p className="mt-6 max-w-reading text-ink-soft text-lead">
        {artworks.length > 1
          ? `Les autres œuvres de ${artist} exposées au musée.`
          : `L'autre œuvre de ${artist} exposée au musée.`}
      </p>

      {/* `priorityCount={0}` : la grille est en bas de page, ces reproductions
          ne sont jamais visibles à l'arrivée. Les charger en priorité volerait
          de la bande passante à l'œuvre qu'on est venu voir, qui est, elle, en
          `priority`. */}
      <ArtworkGrid artworks={artworks} priorityCount={0} className="mt-16" />
    </Section>
  );
}
