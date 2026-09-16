import { cn } from "@/lib/cn";

interface MediaPlaceholderProps {
  /** Court texte affiché sous le pictogramme. Omis, seul le pictogramme s'affiche. */
  label?: string;
  className?: string;
}

/**
 * Cadre de remplacement, affiché quand aucune reproduction n'est disponible.
 *
 * Trois situations l'amènent à l'écran, toutes traitées de la même façon :
 * l'œuvre n'a pas d'image dans l'API, son image est hébergée sur un domaine que
 * le site n'accepte pas, ou le fichier ne se charge pas côté navigateur.
 *
 * Pourquoi un visuel dessiné plutôt qu'un cadre vide : une case grise ressemble
 * à un bug de chargement. Un pictogramme de tableau dit que l'œuvre existe et
 * que c'est sa reproduction qui manque — ce qui est vrai, et rassure le visiteur.
 *
 * `role="img"` + `aria-label` : pour un lecteur d'écran, l'ensemble est une seule
 * image porteuse de sens, pas un assortiment de traits sans rapport.
 */
export function MediaPlaceholder({
  label = "Reproduction indisponible",
  className,
}: MediaPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-line px-4 text-ink-mute",
        className,
      )}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden="true"
        className="h-10 w-10"
      >
        {/* Le cadre, puis la toile */}
        <rect x="5" y="7" width="38" height="30" rx="1.5" />
        <rect x="9" y="11" width="30" height="22" rx="1" />
        {/* Un paysage sommaire : soleil et relief */}
        <circle cx="31.5" cy="17" r="2.5" />
        <path d="M9.5 30 L16.5 21.5 L22 28 L26 23.5 L38.5 33" />
      </svg>

      {label && <p className="text-center text-xs leading-snug">{label}</p>}
    </div>
  );
}
