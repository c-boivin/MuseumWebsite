import Link from "next/link";
import { Media } from "@/components/ui/Media";
import type { ArtworkPreview } from "@/types/artwork";

interface ArtworkCardProps {
  artwork: ArtworkPreview;
  /** Le premier visuel visible à l'écran est chargé en priorité (performance). */
  priority?: boolean;
}

/**
 * Carte d'une œuvre dans une grille.
 *
 * Composant enfant pur : il ne va chercher aucune donnée, il reçoit son œuvre en
 * prop et l'affiche. C'est le parent (page Collection, résultats de recherche…)
 * qui décide d'où vient la donnée. Cette séparation est ce qui permet
 * de réutiliser la même carte partout, y compris avec des données d'API.
 *
 * Le lien est construit sur le `slug` et non sur l'`id` : `/collection/mona-lisa`
 * se lit, se partage et se référence mieux que `/collection/2`. L'API impose
 * d'ailleurs ce choix — `GET /objects/2` répond 404, seul le slug est accepté.
 */
export function ArtworkCard({ artwork, priority = false }: ArtworkCardProps) {
  return (
    <article>
      <Link href={`/collection/${artwork.slug}`} className="group block">
        {/* `cover` dans un cadre carré : toutes les œuvres occupent exactement
            la même surface, quelle que soit leur orientation.

            C'est un ARBITRAGE, pas une évidence. En `contain` — le choix
            précédent — aucune œuvre n'était rognée, mais chacune gardait sa
            largeur propre : un paysage occupait toute la colonne, un portrait
            s'y trouvait à l'étroit, et la grille paraissait désordonnée. Les
            deux ne sont pas conciliables tant que l'API ne donne aucune
            dimension d'image : sans elle, impossible de réserver une hauteur
            juste par œuvre, donc impossible d'aligner les largeurs sans fixer
            aussi le cadre.

            `top` est ce qui rend le rognage supportable : dans un portrait
            peint, le visage est dans le tiers haut, et c'est le bas — buste,
            mains, premier plan — qui se sacrifie le mieux.

            L'œuvre entière reste visible sur sa fiche, en `contain`. */}
        <Media
          item={artwork.media}
          ratio="square"
          fit="cover"
          position="top"
          priority={priority}
          sizes="33vw"
          fallbackLabel="Reproduction indisponible"
          /* Le fond par défaut de <Media /> est conservé : en `cover` l'image
             couvre tout le cadre une fois chargée, et l'aplat ne se voit donc que
             pendant le chargement — où il sert justement de silhouette. */
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
    </article>
  );
}
