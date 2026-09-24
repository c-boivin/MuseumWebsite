import {
  GROUP_PRICE,
  GROUP_THRESHOLD,
  type TicketCategory,
  type TicketOption,
  ticketCategories,
  ticketOptions,
} from "@/data/tarifs";

/**
 * Calcul du panier de la billetterie.
 *
 * Fonction pure, volontairement hors du store : le store ne retient que ce que
 * l'utilisateur a choisi, tout le reste s'en déduit à chaque rendu. Rien de
 * calculé n'est stocké, donc rien ne peut se désynchroniser du choix réel.
 *
 * Même logique que `lib/facets.ts` : l'état minimal d'un côté, la dérivation de
 * l'autre.
 */

/** Une ligne du récapitulatif : un tarif ou une option, avec sa quantité. */
export interface CartLine {
  id: string;
  label: string;
  quantity: number;
  /** Prix unitaire réellement facturé — 15 € sous remise groupe. */
  unitPrice: number;
  /** Prix affiché à la grille tarifaire. Diffère de `unitPrice` sous remise. */
  basePrice: number;
  total: number;
}

export interface Cart {
  ticketLines: CartLine[];
  optionLines: CartLine[];
  /**
   * Nombre de personnes, entrées gratuites comprises : c'est ce compte qui
   * déclenche le tarif groupe et qui multiplie les options.
   */
  visitors: number;
  isGroup: boolean;
  /** Montant économisé grâce au tarif groupe. 0 hors groupe. */
  savings: number;
  total: number;
}

/** Quantité choisie par catégorie de billet, indexée par `TicketCategory.id`. */
export type TicketQuantities = Record<string, number>;

/**
 * `Math.min` et non un remplacement sec par 15 € : le tarif groupe est une
 * remise, il ne doit jamais faire monter un prix. Sans ce garde-fou, une entrée
 * −5 ans gratuite deviendrait payante en rejoignant un groupe.
 */
function unitPriceOf(category: TicketCategory, isGroup: boolean): number {
  return isGroup ? Math.min(category.price, GROUP_PRICE) : category.price;
}

export function computeCart(
  quantities: TicketQuantities,
  selectedOptions: string[],
): Cart {
  const visitors = ticketCategories.reduce(
    (count, category) => count + (quantities[category.id] ?? 0),
    0,
  );

  const isGroup = visitors >= GROUP_THRESHOLD;

  const ticketLines: CartLine[] = [];
  let savings = 0;

  for (const category of ticketCategories) {
    const quantity = quantities[category.id] ?? 0;
    if (quantity === 0) continue;

    const unitPrice = unitPriceOf(category, isGroup);
    savings += (category.price - unitPrice) * quantity;

    ticketLines.push({
      id: category.id,
      label: category.label,
      quantity,
      unitPrice,
      basePrice: category.price,
      total: unitPrice * quantity,
    });
  }

  /* Une option cochée est facturée pour toutes les personnes du panier : lecture
     littérale du « 2 € / personne » de la grille. Elle n'apparaît donc pas tant
     qu'aucun billet n'est choisi. */
  const optionLines: CartLine[] = ticketOptions
    .filter((option: TicketOption) => selectedOptions.includes(option.id))
    .map((option) => ({
      id: option.id,
      label: option.label,
      quantity: visitors,
      unitPrice: option.price,
      basePrice: option.price,
      total: option.price * visitors,
    }))
    .filter((line) => line.quantity > 0);

  const total = [...ticketLines, ...optionLines].reduce(
    (sum, line) => sum + line.total,
    0,
  );

  return { ticketLines, optionLines, visitors, isGroup, savings, total };
}

/**
 * Écrit à la main plutôt qu'avec `Intl.NumberFormat` : tous les prix sont des
 * entiers d'euros, et Intl diffère entre Node et le navigateur sur l'espace qui
 * précède le symbole. Les deux rendraient des chaînes différentes pour le même
 * prix, donc une erreur d'hydratation sur chaque ligne.
 */
export function formatPrice(value: number): string {
  return `${value} €`;
}
