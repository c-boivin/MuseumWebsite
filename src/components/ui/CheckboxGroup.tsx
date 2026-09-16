import { cn } from "@/lib/cn";

export interface CheckboxOption {
  /** Valeur écrite dans l'URL. */
  value: string;
  /**
   * Nom de l'option. Toujours obligatoire, même en mode pastille où il n'est pas
   * affiché : c'est lui qu'annonce un lecteur d'écran, et qui apparaît au survol.
   */
  label: string;
  /** Couleur CSS de la pastille, en mode `swatches`. Ignoré en mode liste. */
  swatch?: string;
}

interface CheckboxGroupProps {
  /** Titre du groupe, annoncé aux lecteurs d'écran via la légende du fieldset. */
  legend: string;
  options: CheckboxOption[];
  /** Valeurs actuellement cochées. */
  selected: string[];
  onToggle: (value: string) => void;
  /**
   * `list` : une case + un libellé par ligne.
   * `swatches` : une rangée de pastilles de couleur, sans texte visible.
   */
  layout?: "list" | "swatches";
  className?: string;
}

/**
 * Groupe de cases à cocher, sans aucune connaissance du métier.
 *
 * Il ne sait ni ce qu'est un siècle ni ce qu'est une teinte : il reçoit des
 * options, des valeurs cochées, et prévient son parent quand on clique. C'est ce
 * qui lui permettra de resservir tel quel pour les options de la billetterie.
 *
 * Choix d'accessibilité, et ils ne sont pas cosmétiques :
 * - `<fieldset>` + `<legend>` : un lecteur d'écran annonce « Siècle, groupe » en
 *   entrant dans la liste, au lieu de six cases sans contexte.
 * - de vraies `<input type="checkbox">` dans les deux modes : la navigation au
 *   clavier, l'annonce « coché / non coché » et le respect des réglages système
 *   viennent gratuitement avec l'élément natif. En mode pastille la case est
 *   masquée visuellement (`sr-only`) mais reste bien là, focusable et cochable.
 */
export function CheckboxGroup({
  legend,
  options,
  selected,
  onToggle,
  layout = "list",
  className,
}: CheckboxGroupProps) {
  return (
    <fieldset className={cn("space-y-3", className)}>
      <legend className="font-medium text-ink-mute text-xs uppercase tracking-[0.2em]">
        {legend}
      </legend>

      <div
        className={cn(
          "pt-1",
          /* Grille de 4 plutôt qu'un `flex-wrap` : le retour à la ligne
             automatique dépend de la largeur disponible et donnait 5 pastilles
             puis 2, une rangée bancale. `w-fit` empêche les colonnes de
             s'étaler sur toute la barre latérale.

             `gap-1` et non `gap-3` : chaque pastille porte désormais sa propre
             enveloppe de sélection, qui ajoute 0.25rem de chaque côté. L'écart
             visible entre deux pastilles reste celui d'avant. */
          layout === "swatches"
            ? "grid w-fit grid-cols-4 gap-1"
            : "flex flex-col gap-2",
        )}
      >
        {options.map((option) =>
          layout === "swatches" ? (
            <label
              key={option.value}
              title={option.label}
              className="cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => onToggle(option.value)}
                className="peer sr-only"
              />
              <span className="sr-only">{option.label}</span>

              {/* `peer-*` : l'apparence de la pastille suit l'état de la case
                  masquée juste au-dessus, sans JavaScript. L'anneau marque la
                  sélection ; `peer-focus-visible` reprend le même repère au
                  clavier, sinon la tabulation deviendrait invisible.

                  L'anneau est une BORDURE sur une enveloppe, et non un `ring`
                  avec `ring-offset` : un ring se dessine hors de la boîte de
                  l'élément, et la colonne de filtres étant un conteneur
                  `overflow-y-auto` (qui rogne aussi sur les côtés), il était
                  coupé sur la première colonne et sous la dernière rangée. Une
                  bordure fait partie de la boîte : elle ne peut pas déborder.
                  Transparente au repos, pour que la pastille ne bouge pas d'un
                  pixel quand on la coche. */}
              <span
                aria-hidden="true"
                className={cn(
                  "block rounded-full border-2 border-transparent p-0.5 transition-colors",
                  "peer-checked:border-ink",
                  "peer-focus-visible:border-ink-mute",
                )}
              >
                {/* La bordure fine garde les teintes claires lisibles sur blanc. */}
                <span
                  style={{ background: option.swatch }}
                  className="block size-7 rounded-full border border-ink/10"
                />
              </span>
            </label>
          ) : (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 text-ink-soft text-sm transition-colors hover:text-ink"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => onToggle(option.value)}
                className="size-4 shrink-0 accent-ink"
              />
              <span>{option.label}</span>
            </label>
          ),
        )}
      </div>
    </fieldset>
  );
}
