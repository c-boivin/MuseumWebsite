"use client";

import { TransitionLink as Link } from "@/components/motion/TransitionLink";
import { CartIcon } from "@/components/ui/CartIcon";
import { selectVisitorCount, useCartStore } from "@/lib/store";

/**
 * Le panier dans le Header : une icône, et une pastille dès qu'il contient
 * quelque chose.
 *
 * C'est lui qui justifie le store. Un panier qui ne s'affiche que sur
 * `/billetterie` n'a besoin que d'un `useState` ; dès que le Header le montre,
 * l'état doit être lisible hors de l'arbre de la page.
 *
 * L'icône est toujours là, même panier vide : un point d'accès qui apparaît et
 * disparaît ne s'apprend jamais, et son apparition décalait la navigation au
 * moment du premier billet. Elle ne fait pas doublon avec l'entrée
 * « Billetterie » — le lien mène à la page, l'icône dit ce qu'on y a laissé.
 *
 * Pas de problème d'hydratation malgré le compteur : le panier n'est pas
 * persisté, il est vide au premier rendu client comme il l'était sur le serveur.
 */
export function CartLink() {
  const count = useCartStore(selectVisitorCount);

  return (
    /* La marge négative compense le padding : zone cliquable de 2.25rem sans
       décaler l'icône par rapport aux liens de navigation. */
    <Link
      /* L'ancre et pas `/billetterie` tout court : la page s'ouvre sur une
         accroche plein écran, on cliquait donc sur son panier pour arriver
         devant une toile. Le lien reste une vraie navigation depuis les autres
         pages, où c'est Next qui cale l'arrivée ; depuis /billetterie, c'est
         Lenis qui y descend. Voir le commentaire de `scroll` dans
         `TransitionLink`, qui les empêche de se marcher dessus. */
      href="/billetterie#panier"
      aria-label={
        count > 0
          ? `Billetterie — ${count} billet${count > 1 ? "s" : ""} dans le panier`
          : "Billetterie — panier vide"
      }
      className="-m-2 relative p-2 text-paper/80 transition-colors hover:text-paper"
    >
      <CartIcon />

      {/* La pastille déborde sur l'icône plutôt que de se poser à côté : à côté,
          elle élargissait le bouton et décalait tout au premier billet. */}
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-paper px-1 font-medium text-ink-deep text-xs tabular-nums leading-none"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
