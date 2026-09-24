import { ArtworkCard } from "@/components/artwork/ArtworkCard";
import { cn } from "@/lib/cn";
import type { ArtworkPreview } from "@/types/artwork";

interface ArtworkGridProps {
  artworks: ArtworkPreview[];
  /** Nombre de cartes chargées en priorité : celles visibles sans scroller. */
  priorityCount?: number;
  /**
   * `/collection` dans le catalogue du musée, `/compte/collection` dans celle du
   * visiteur : le lien doit rester dans le parcours qu'on suit.
   */
  basePath?: string;
  className?: string;
}

/**
 * Grille nue d'œuvres, sans titre ni contexte.
 *
 * Extraite d'une section d'accueil le jour où la page Collection a eu besoin de
 * la même grille sans l'en-tête qui allait avec. Règle appliquée : dès qu'un bout
 * de balisage sert à deux endroits, il devient un composant — sinon les deux
 * copies divergent à la première retouche.
 */
export function ArtworkGrid({
  artworks,
  priorityCount = 3,
  basePath,
  className,
}: ArtworkGridProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-x-6 gap-y-12", className)}>
      {artworks.map((artwork, index) => (
        <ArtworkCard
          key={artwork.slug}
          artwork={artwork}
          priority={index < priorityCount}
          basePath={basePath}
        />
      ))}
    </div>
  );
}
