"use client";

import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { GROUP_PRICE, GROUP_THRESHOLD, ticketCategories } from "@/data/tarifs";
import { formatPrice } from "@/lib/cart";
import { selectVisitorCount, useCartStore } from "@/lib/store";

/**
 * La grille tarifaire, avec son sélecteur de quantité par ligne.
 *
 * Client Component : il lit et écrit le panier. C'est le plus bas niveau
 * possible — la page et la section qui l'entourent restent rendues côté serveur.
 *
 * Il n'affiche PAS de total : c'est le travail de `CartSummary`, qui lit le même
 * store. Les deux composants ne se parlent pas et ne partagent aucune prop, ce
 * qui est précisément l'intérêt du store ici.
 */
export function TicketList() {
  const quantities = useCartStore((state) => state.quantities);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const visitors = useCartStore(selectVisitorCount);

  const isGroup = visitors >= GROUP_THRESHOLD;

  return (
    <div>
      <ul className="divide-y divide-line border-line border-y">
        {ticketCategories.map((category) => {
          const quantity = quantities[category.id] ?? 0;
          /* La remise ne descend jamais un prix déjà inférieur à 15 € : même
             règle que `unitPriceOf` dans lib/cart.ts, et même raison — un tarif
             enfant ne doit pas augmenter parce qu'on vient en groupe. */
          const isDiscounted = isGroup && category.price > GROUP_PRICE;

          return (
            <li
              key={category.id}
              className="flex items-center justify-between gap-8 py-5"
            >
              <div className="space-y-1">
                <p className="font-medium text-ink">{category.label}</p>
                <p className="text-ink-mute text-sm">{category.detail}</p>
              </div>

              <div className="flex items-center gap-8">
                {/* Le prix barré reste affiché à côté du prix groupe : sans lui,
                    le visiteur verrait son tarif changer tout seul en ajoutant
                    un dixième billet et le prendrait pour une erreur. */}
                <p className="w-28 text-right tabular-nums">
                  {isDiscounted && (
                    <span className="mr-2 text-ink-mute text-sm line-through">
                      {formatPrice(category.price)}
                    </span>
                  )}
                  <span
                    className={
                      category.price === 0 ? "text-ink-mute" : "text-ink"
                    }
                  >
                    {category.price === 0
                      ? "Gratuit"
                      : formatPrice(
                          isDiscounted ? GROUP_PRICE : category.price,
                        )}
                  </span>
                </p>

                <QuantityStepper
                  label={category.label}
                  value={quantity}
                  onChange={(value) => setQuantity(category.id, value)}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* Annonce de la règle groupe, et son état courant. `aria-live` parce que
          le passage au tarif groupe se produit sans que rien ne prenne le focus :
          un utilisateur de lecteur d'écran n'aurait aucun moyen de l'apprendre. */}
      <p aria-live="polite" className="mt-6 text-ink-soft text-sm">
        {isGroup
          ? `Tarif groupe appliqué : ${visitors} personnes, soit ${formatPrice(GROUP_PRICE)} par entrée payante.`
          : `À partir de ${GROUP_THRESHOLD} personnes, le tarif groupe ramène chaque entrée payante à ${formatPrice(GROUP_PRICE)}.`}
      </p>
    </div>
  );
}
