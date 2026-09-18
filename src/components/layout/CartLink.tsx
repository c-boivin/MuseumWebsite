"use client";

import { TransitionLink as Link } from "@/components/motion/TransitionLink";
import { CartIcon } from "@/components/ui/CartIcon";
import { selectVisitorCount, useCartStore } from "@/lib/store";

/**
 * Le panier dans le Header : une icône, et une pastille dès qu'il contient
 * quelque chose.
 *
 * C'EST LUI QUI JUSTIFIE LE STORE. Un panier qui ne s'affiche que sur
 * `/billetterie` n'a besoin de rien de plus qu'un `useState` ; à partir du
 * moment où le Header le montre, l'état doit être lisible depuis un composant
 * monté par le root layout, c'est-à-dire hors de l'arbre de la page. Faire
 * remonter l'état jusqu'à un ancêtre commun voudrait dire poser un Context
 * autour de tout le site — soit réécrire à la main ce que Zustand fait déjà
 * pour la transition de page.
 *
 * L'ICÔNE EST TOUJOURS LÀ, même panier vide, et c'est un changement assumé par
 * rapport à la première version qui la masquait : un point d'accès qui
 * apparaît et disparaît ne s'apprend jamais, et son apparition décalait toute
 * la navigation au moment où l'on ajoutait son premier billet. Elle ne fait pas
 * doublon avec l'entrée « Billetterie » de la navigation : le lien mène à la
 * page, l'icône dit ce qu'on y a laissé.
 *
 * Pas de problème d'hydratation malgré le compteur : le panier n'est pas
 * persisté, il est donc vide au premier rendu client exactement comme il
 * l'était sur le serveur.
 */
export function CartLink() {
  const count = useCartStore(selectVisitorCount);

  return (
    /* La marge négative compense le padding : la zone cliquable fait 2.25rem de
       côté — un confort de clic — sans pour autant décaler l'icône par rapport
       aux liens de navigation. */
    <Link
      /* L'ancre, et pas `/billetterie` tout court : la page s'ouvre sur une
         accroche plein écran, on cliquait donc sur son panier pour arriver
         devant une toile. Le lien reste une vraie navigation — `TransitionLink`
         ne traite en simple défilement que les ancres de la page COURANTE —
         donc la transition se joue normalement depuis les autres pages, où
         c'est Next qui cale la page sur le panier à l'arrivée. Depuis
         /billetterie, c'est Lenis qui y descend en défilement amorti. Les deux
         chemins sont distincts : voir le commentaire de `scroll` dans
         `TransitionLink`, c'est ce qui les empêche de se marcher dessus. */
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
