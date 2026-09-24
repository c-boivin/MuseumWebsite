import { FavoriteButton } from "@/components/artwork/FavoriteButton";
import { TransitionLink as Link } from "@/components/motion/TransitionLink";
import { Media } from "@/components/ui/Media";
import type { ArtworkPreview } from "@/types/artwork";

interface ArtworkCardProps {
  artwork: ArtworkPreview;
  /** Le premier visuel visible à l'écran est chargé en priorité. */
  priority?: boolean;
  /**
   * `/collection` dans le catalogue du musée, `/compte/collection` dans celle du
   * visiteur : le lien doit rester dans le parcours qu'on suit.
   */
  basePath?: string;
}

/**
 * Carte d'une œuvre dans une grille.
 *
 * Composant enfant pur : il reçoit son œuvre en prop, c'est le parent qui décide
 * d'où vient la donnée.
 *
 * Le lien est construit sur le `slug` et non sur l'`id` : l'API impose ce choix,
 * `GET /objects/2` répond 404.
 */
export function ArtworkCard({
  artwork,
  priority = false,
  basePath = "/collection",
}: ArtworkCardProps) {
  return (
    /* `group` sur l'article et non sur le lien : le signet est frère du lien, un
       `group` porté par le lien ne l'atteindrait pas. `relative` lui sert
       d'ancrage. */
    <article className="group relative">
      {/* `transitionLabel` : le panneau annonce le titre du tableau, pas
          « Œuvre ». L'URL ne connaît que le slug, la carte connaît l'œuvre. */}
      <Link
        href={`${basePath}/${artwork.slug}`}
        transitionLabel={artwork.title}
        className="block"
      >
        {/* `cover` dans un cadre carré : toutes les œuvres occupent la même
            surface. C'est un arbitrage — en `contain`, aucune n'était rognée
            mais chacune gardait sa largeur propre et la grille paraissait
            désordonnée. Les deux ne sont pas conciliables tant que l'API ne
            donne aucune dimension d'image.

            `top` rend le rognage supportable : dans un portrait peint, le visage
            est dans le tiers haut. L'œuvre entière reste sur sa fiche. */}
        <Media
          item={artwork.media}
          ratio="square"
          fit="cover"
          position="top"
          priority={priority}
          sizes="33vw"
          fallbackLabel="Reproduction indisponible"
          /* Le fond par défaut de <Media /> est conservé : en `cover` l'aplat ne
             se voit que pendant le chargement, où il sert de silhouette. */
          className="transition-opacity duration-300 group-hover:opacity-90"
        />

        <div className="mt-4 space-y-1">
          <h3 className="font-medium text-base leading-snug">
            {artwork.title}
          </h3>
          <p className="text-ink-soft text-sm">
            {artwork.artist ?? "Artiste inconnu"}
            {artwork.year !== null && ` — ${artwork.year}`}
          </p>
          {artwork.movement && (
            <p className="text-ink-mute text-sm">{artwork.movement}</p>
          )}
        </div>
      </Link>

      {/* Hors du lien, obligatoirement : un <button> dans un <a> est du HTML
          invalide, le navigateur défait l'imbrication en réparant le document.
          Le signet est donc un frère du lien, ramené par-dessus la reproduction.

          `z-10` : l'ordre du DOM suffirait aujourd'hui, mais la moindre couche
          d'empilement ajoutée au lien ferait repasser le signet dessous et le
          clic atterrirait sur le lien. */}
      <FavoriteButton
        slug={artwork.slug}
        title={artwork.title}
        className="absolute top-3 right-3 z-10"
      />
    </article>
  );
}
