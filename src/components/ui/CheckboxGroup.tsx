import { cn } from "@/lib/cn";

export interface CheckboxOption {
  /** Valeur écrite dans l'URL. */
  value: string;
  /**
   * Toujours obligatoire, même en mode pastille où il n'est pas affiché : c'est
   * lui qu'annonce un lecteur d'écran, et qui apparaît au survol.
   */
  label: string;
  /** Couleur CSS de la pastille, en mode `swatches`. Ignoré en mode liste. */
  swatch?: string;
  /**
   * Précision sous le libellé, en mode liste. Ajoutée pour les options de la
   * billetterie, qui doivent dire ce qu'on achète en plus de son nom.
   */
  description?: string;
}

interface CheckboxGroupProps {
  /** Titre du groupe, annoncé via la légende du fieldset. */
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
 * Groupe de cases à cocher, sans aucune connaissance du métier : il reçoit des
 * options et prévient son parent. C'est ce qui lui permet de servir aussi bien
 * aux filtres de la collection qu'aux options de la billetterie.
 *
 * Deux choix d'accessibilité qui ne sont pas cosmétiques :
 * - `<fieldset>` + `<legend>` : un lecteur d'écran annonce « Siècle, groupe » au
 *   lieu de six cases sans contexte ;
 * - de vraies `<input type="checkbox">` dans les deux modes. En mode pastille la
 *   case est masquée visuellement mais reste focusable et cochable.
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
      <legend className="eyebrow text-ink-mute">{legend}</legend>

      <div
        className={cn(
          "pt-1",
          /* Grille de 4 plutôt qu'un `flex-wrap`, dont le retour à la ligne
             donnait 5 pastilles puis 2. `gap-1` et non `gap-3` : chaque pastille
             porte son enveloppe de sélection, qui ajoute 0.25rem de chaque
             côté. */
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

              {/* `peer-*` : l'apparence suit l'état de la case masquée, sans
                  JavaScript. L'anneau est une bordure sur une enveloppe et non
                  un `ring` : un ring se dessine hors de la boîte, et la colonne
                  de filtres étant en `overflow-y-auto`, il était coupé sur la
                  première colonne. Transparent au repos, pour que la pastille ne
                  bouge pas d'un pixel quand on la coche. */}
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
              className={cn(
                "flex cursor-pointer gap-3 text-ink-soft text-sm transition-colors hover:text-ink",
                /* Aligné en haut dès qu'il y a deux lignes : centrée, la case
                   flotterait au milieu du texte au lieu de pointer la ligne
                   qu'elle coche. */
                option.description ? "items-start" : "items-center",
              )}
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => onToggle(option.value)}
                className={cn(
                  "size-4 shrink-0 accent-ink",
                  option.description && "mt-0.5",
                )}
              />
              <span>
                {option.label}
                {option.description && (
                  <span className="mt-1 block text-ink-mute">
                    {option.description}
                  </span>
                )}
              </span>
            </label>
          ),
        )}
      </div>
    </fieldset>
  );
}
