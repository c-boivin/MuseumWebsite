"use client";

import {
  CheckboxGroup,
  type CheckboxOption,
} from "@/components/ui/CheckboxGroup";
import { includedExtra, ticketOptions } from "@/data/tarifs";
import { formatPrice } from "@/lib/cart";
import { selectVisitorCount, useCartStore } from "@/lib/store";

/**
 * Suppléments de visite : audioguide et guide papier.
 *
 * Des cases à cocher, pas des quantités — une option est prise pour tout le
 * groupe ou pour personne, et son prix est multiplié par le nombre d'entrées
 * (voir `computeCart`). Le composant lui-même ne calcule rien : il coche.
 *
 * Il réutilise `ui/CheckboxGroup` tel quel, celui des filtres de la collection.
 * C'était l'usage annoncé dans sa documentation ; la seule chose qu'il a fallu
 * lui ajouter est une ligne de précision sous le libellé.
 */
export function TicketOptions() {
  const selected = useCartStore((state) => state.options);
  const toggleOption = useCartStore((state) => state.toggleOption);
  const visitors = useCartStore(selectVisitorCount);

  /* Le prix est collé au libellé plutôt que placé dans une colonne à part : une
     option n'a que deux états, on ne la compare pas à ses voisines comme on
     compare deux tarifs d'entrée. */
  const options: CheckboxOption[] = ticketOptions.map((option) => ({
    value: option.id,
    label: `${option.label} — ${formatPrice(option.price)} par personne`,
    description: option.detail,
  }));

  return (
    <div className="space-y-4">
      <CheckboxGroup
        legend="Options de visite"
        options={options}
        selected={selected}
        onToggle={toggleOption}
      />

      {/* Une option cochée sans aucun billet ne produit aucune ligne dans le
          récapitulatif, puisqu'elle se facture par personne. Sans cette phrase,
          le visiteur coche l'audioguide, ne voit rien changer, et conclut que
          l'interface est cassée. */}
      {selected.length > 0 && visitors === 0 && (
        <p aria-live="polite" className="text-accent text-sm">
          Les options se facturent par personne : ajoutez d&apos;abord une
          entrée.
        </p>
      )}

      <p className="text-ink-mute text-sm">{includedExtra}</p>
    </div>
  );
}
