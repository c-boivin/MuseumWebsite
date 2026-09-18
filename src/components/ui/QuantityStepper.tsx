import { cn } from "@/lib/cn";

interface QuantityStepperProps {
  value: number;
  /** Réservé aux Client Components : un Server Component ne peut pas en passer. */
  onChange: (value: number) => void;
  /**
   * Ce qui est compté — « Entrée adulte ». Jamais affiché : il n'existe que pour
   * les lecteurs d'écran, qui annonceraient sinon sept fois « moins, 0, plus »
   * sans jamais dire de quel tarif il s'agit.
   */
  label: string;
  min?: number;
  max?: number;
  className?: string;
}

/**
 * Sélecteur de quantité : − valeur +.
 *
 * Générique et sans métier, d'où sa place dans `ui/` : il ne sait pas qu'il
 * compte des billets. Il pourrait compter n'importe quoi, et c'est ce qui le
 * rendra réutilisable si la boutique du musée arrive un jour.
 *
 * De vrais `<button>` et pas un `<input type="number">` : le champ numérique
 * natif accepte le collage de texte, les décimales et les valeurs négatives, et
 * son apparence n'est pas stylable de la même façon d'un navigateur à l'autre.
 * Deux boutons ne peuvent produire qu'un entier dans les bornes.
 */
export function QuantityStepper({
  value,
  onChange,
  label,
  min = 0,
  max = 99,
  className,
}: QuantityStepperProps) {
  const stepClass =
    "flex size-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:border-line disabled:text-ink-mute/40";

  return (
    /* Un vrai `<fieldset>` plutôt qu'un `<div role="group">` : même annonce pour
       le lecteur d'écran, mais avec l'élément HTML qui existe déjà pour ça —
       c'est le choix déjà fait par `CheckboxGroup`. Sa légende est masquée à
       l'œil : la grille tarifaire affiche déjà le nom du tarif juste à gauche,
       le répéter à l'écran ne servirait qu'à alourdir la ligne. */
    /* `gap-1` et non `gap-3` : à 0.75rem d'écart, les deux boutons et le nombre
       se lisaient comme trois éléments indépendants posés côte à côte, pas comme
       une seule commande. Resserrés, ils forment un groupe — et l'écart avec le
       prix, à leur gauche, redevient ce qui sépare deux informations. */
    <fieldset className={cn("flex items-center gap-1", className)}>
      <legend className="sr-only">{label}</legend>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Retirer un billet — ${label}`}
        className={stepClass}
      >
        {/* Le vrai signe moins U+2212, pas un trait d'union : à la même taille
            que le + juste à côté, un tiret paraît deux fois plus court. */}
        <span aria-hidden="true">−</span>
      </button>

      {/* `aria-live` : la valeur change sans que le focus la traverse, elle doit
          donc s'annoncer d'elle-même. `tabular-nums` fige la largeur des
          chiffres — sans lui, le passage de 1 à 8 décale les deux boutons. */}
      <span
        aria-live="polite"
        className="w-6 text-center text-base tabular-nums"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Ajouter un billet — ${label}`}
        className={stepClass}
      >
        <span aria-hidden="true">+</span>
      </button>
    </fieldset>
  );
}
