import { cn } from "@/lib/cn";

interface FrameProps {
  children: React.ReactNode;
  /**
   * Fond sur lequel le cadre est posé, et non couleur du cadre : c'est au
   * composant de choisir le trait qui reste lisible. Un appelant qui devrait
   * écrire la couleur finirait par écrire une valeur en dur.
   */
  tone?: "paper" | "ink";
  className?: string;
}

/**
 * Équerres de cadrage autour d'un contenu : le motif du monogramme (voir
 * <Logo />) posé autour des reproductions, le même repère à deux échelles.
 *
 * Aucune logique métier — il encadrerait aussi bien une vidéo qu'un plan d'accès,
 * d'où sa place dans `ui/`.
 *
 * Règle de direction artistique : LE CADRE MARQUE L'ŒUVRE QU'ON REGARDE, JAMAIS
 * CELLES QU'ON PARCOURT.
 *
 * - oui : la reproduction d'un Hero, celle d'une fiche, l'œuvre de la sélection,
 *   le détail en bande du bloc éditorial — une image unique, montrée pour
 *   elle-même ;
 * - non : les cartes de /collection, les vignettes secondaires, la spirale.
 *   Répété trente-neuf fois le motif devient du papier peint ; les équerres
 *   débordent de 0.75rem et se cogneraient dans les gouttières ; et une grille
 *   sert à comparer des œuvres, pas à en contempler une.
 *
 * Les équerres sont posées à l'extérieur du contenu (`-inset-3`) : prévoir
 * 0.75rem de dégagement, sinon elles débordent.
 */
export function Frame({ children, tone = "paper", className }: FrameProps) {
  /* `text-*` puis `border-current` : la couleur est écrite une fois, pas quatre. */
  const corner = "absolute size-6 border-current";

  return (
    <div
      className={cn(
        "relative",
        tone === "ink" ? "text-paper/40" : "text-ink/25",
        className,
      )}
    >
      {children}

      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-3"
      >
        <span className={cn(corner, "top-0 left-0 border-t border-l")} />
        <span className={cn(corner, "top-0 right-0 border-t border-r")} />
        <span className={cn(corner, "bottom-0 left-0 border-b border-l")} />
        <span className={cn(corner, "right-0 bottom-0 border-r border-b")} />
      </span>
    </div>
  );
}
