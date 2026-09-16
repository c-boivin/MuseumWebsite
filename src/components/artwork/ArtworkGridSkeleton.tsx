import { cn } from "@/lib/cn";

interface ArtworkGridSkeletonProps {
  /** Nombre de cartes fantômes. Six = une grille de deux rangées. */
  count?: number;
  className?: string;
}

/**
 * Silhouette d'une grille d'œuvres, affichée pendant le chargement des données.
 *
 * On dessine des rectangles aux dimensions des vraies cartes plutôt qu'un
 * « Chargement… » : la page ne saute pas quand le contenu arrive, et l'attente
 * paraît plus courte parce que la mise en page est déjà là.
 */
export function ArtworkGridSkeleton({
  count = 6,
  className,
}: ArtworkGridSkeletonProps) {
  /* Clés dérivées de l'index : cette liste est purement décorative, elle n'est
     ni réordonnée ni filtrée, donc l'index est un identifiant stable ici. */
  const cards = Array.from({ length: count }, (_, index) => index);

  return (
    <div className={cn("grid grid-cols-3 gap-x-6 gap-y-12", className)}>
      {cards.map((index) => (
        <div key={index} className="space-y-4">
          {/* Même ratio que le cadre d'<ArtworkCard /> : s'ils divergent, la page
              saute au moment où les vraies œuvres remplacent la silhouette. */}
          <div className="aspect-square w-full animate-pulse bg-line" />
          <div className="h-4 w-3/4 animate-pulse bg-line" />
          <div className="h-3 w-1/2 animate-pulse bg-line" />
        </div>
      ))}
    </div>
  );
}
