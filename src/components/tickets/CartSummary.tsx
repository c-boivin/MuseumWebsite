"use client";

import { Button } from "@/components/ui/Button";
import { CartIcon } from "@/components/ui/CartIcon";
import { Heading } from "@/components/ui/Heading";
import { site } from "@/data/site";
import { type CartLine, computeCart, formatPrice } from "@/lib/cart";
import { cn } from "@/lib/cn";
import { useCartStore, useTransitionStore } from "@/lib/store";

/**
 * Le récapitulatif collant : ce qui est dans le panier, et ce que ça coûte.
 *
 * Il ne reçoit AUCUNE prop. Il lit le store, comme `TicketList` juste à côté
 * l'écrit — les deux ne se connaissent pas. C'est ce qui rend la mise en page
 * libre : déplacer le récapitulatif ailleurs dans la page, ou un jour dans le
 * Header, ne demande de toucher ni à l'un ni à l'autre.
 *
 * Il ne stocke rien non plus : `computeCart` recalcule tout à chaque rendu à
 * partir des choix. Un total gardé en mémoire finirait toujours par survivre à
 * un changement de quantité qu'il aurait manqué.
 *
 * DESSINÉ COMME UN BILLET, et c'est le seul endroit du site où un bloc
 * d'interface prend une forme figurative. Fond noir comme le Header et le
 * Footer, nom du musée en tête, séparation perforée entre le détail et le
 * montant dû. Une boîte bordée faisait le travail mais ne racontait rien : sur
 * une page qui ne vend rien pour de vrai, c'est le seul objet que le visiteur
 * repart avec.
 *
 * La perforation n'est pas un décor gratuit : elle sépare ce qu'on a choisi de
 * ce qu'on doit payer, c'est-à-dire exactement l'endroit où le regard doit
 * s'arrêter.
 */
export function CartSummary() {
  const quantities = useCartStore((state) => state.quantities);
  const options = useCartStore((state) => state.options);
  const clear = useCartStore((state) => state.clear);

  /* IL S'EFFACE QUAND ON QUITTE LA PAGE, et c'est le seul bloc du site à le
     faire. Le panneau de `motion/PageTransition` est noir et monte DU BAS ; le
     panier est noir, large, et collé EN HAUT. Résultat : le mur avait déjà
     couvert tout le bas de l'écran que la moitié droite du haut était noire
     depuis le premier instant — on ne voyait plus une page qui se fait
     recouvrir, on voyait un noir installé, et la transition paraissait plus
     longue ici que partout ailleurs alors qu'elle dure exactement autant.

     Le correctif est pris côté PAGE et non côté transition : c'est la page qui
     a un bloc de la couleur du mur, pas le mur qui est trop lent. Le panier
     rend donc sa place avant que le mur n'arrive, et le mur monte sur un fond
     clair comme sur les autres pages.

     Sur `leaving` seulement : au retour (`entering`), le panneau couvre encore
     l'écran, l'opacité est déjà revenue à 1 quand il se retire. Et en
     `prefers-reduced-motion` la phase ne quitte jamais `idle` — `TransitionLink`
     navigue sans animer — donc rien à neutraliser ici. */
  const isLeaving = useTransitionStore((state) => state.phase === "leaving");

  const cart = computeCart(quantities, options);
  const isEmpty = cart.ticketLines.length === 0;

  return (
    /* `sticky` calé sous le header collant, même calcul que la colonne de
       filtres de la collection : le total doit rester visible pendant qu'on
       parcourt la grille tarifaire, sinon il faut remonter pour savoir où on en
       est.

       `data-tone="ink"` : inverse le contour de focus (globals.css). Sans lui,
       la tabulation jusqu'au bouton « Payer » dessinerait un trait noir sur
       fond noir. */
    <aside
      /* Cible de l'icône panier du Header (`layout/CartLink`). Sans elle, le
         lien tombait en haut de `/billetterie`, c'est-à-dire sur une accroche
         plein écran : on cliquait sur son panier et on ne le voyait pas. */
      id="panier"
      data-tone="ink"
      /* `scroll-mt` : on arrive sur le BLOC, pas collé au sommet du panier.
         Sans lui, l'ancre calait le bord haut du panneau juste sous le header et
         la page paraissait tronquée — plus aucune respiration au-dessus.

         La valeur reprend le token de padding de la section qui l'entoure : le
         défilement s'arrête donc pile à la frontière du bloc, et ce sont ses
         propres marges qui font l'air. Si le rythme de la section change, le
         point d'arrivée suit tout seul.

         Il s'AJOUTE au `scroll-padding-top` du document (globals.css), et c'est
         exactement ce qu'on veut ici : 4rem pour passer sous le header, plus la
         respiration du bloc. Vrai aussi bien du saut natif de Next, quand on
         arrive depuis une autre page, que du défilement amorti de Lenis quand on
         est déjà sur /billetterie — les deux lisent les deux propriétés. */
      className={cn(
        "sticky top-[calc(var(--spacing-header)+1.5rem)] scroll-mt-section-sm rounded-lg bg-ink-deep px-8 py-7 text-paper",
        /* 300 ms : assez court pour que la place soit rendue bien avant que le
           mur n'atteigne le haut de l'écran (il met 0,95 s à couvrir), assez
           long pour que le bloc se retire au lieu de s'éteindre d'un coup. */
        "transition-opacity duration-300 ease-out",
        isLeaving && "opacity-0",
      )}
    >
      <p className="eyebrow text-paper/50">{site.shortName}</p>

      <Heading as="h2" size="heading" className="mt-2 text-paper">
        Votre panier
      </Heading>

      {isEmpty ? (
        /* L'état vide est la première chose que voit un visiteur en arrivant :
           c'est à lui de dire où cliquer, pas de s'excuser d'être vide. */
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <CartIcon className="size-8 text-paper/30" />
          <p className="text-paper/60 text-sm leading-relaxed">
            Aucun billet sélectionné.
            <br />
            Choisissez vos entrées dans la grille tarifaire.
          </p>
        </div>
      ) : (
        <>
          {/* Le défilement porte sur les LIGNES seules, pas sur tout le panneau :
              le total et le bouton doivent rester visibles quoi qu'il arrive, et
              un `overflow` sur le panneau rognerait les encoches de la
              perforation, qui débordent volontairement sur les côtés. */}
          <ul className="scrollbar-none mt-6 max-h-76 space-y-4 overflow-y-auto">
            {cart.ticketLines.map((line) => (
              <CartLineRow key={line.id} line={line} unit="billet" />
            ))}

            {cart.optionLines.map((line) => (
              <CartLineRow key={line.id} line={line} unit="personne" />
            ))}
          </ul>

          {/* L'économie est affichée en valeur, pas seulement signalée : « tarif
              groupe appliqué » n'apprend rien, « −90 € » se comprend seul. */}
          {cart.savings > 0 && (
            <p className="mt-5 flex items-baseline justify-between text-sm">
              <span className="text-paper/60">Remise groupe</span>
              <span className="tabular-nums">−{formatPrice(cart.savings)}</span>
            </p>
          )}

          <Perforation />

          {/* `aria-live` : le total change à chaque clic sur un stepper, qui est
              ailleurs dans la page. Sans annonce, l'information principale de
              l'écran serait la seule à ne jamais être lue. */}
          <div aria-live="polite" className="flex items-end justify-between">
            <p>
              <span className="block font-medium text-sm">Total</span>
              <span className="text-paper/50 text-xs">
                {cart.visitors} personne{cart.visitors > 1 ? "s" : ""}
              </span>
            </p>
            {/* `title` et non `figure`, alors que c'est bien un chiffre : le
                palier `figure` est celui des chiffres MIS EN SCÈNE de l'accueil,
                au milieu du blanc. Celui-ci vit dans un panneau de 24rem à côté
                de son intitulé — à 3.5rem, un total à quatre chiffres viendrait
                buter contre le mot « Total ». */}
            <p className="font-display text-title leading-none tabular-nums">
              {formatPrice(cart.total)}
            </p>
          </div>
        </>
      )}

      <div className="mt-8 space-y-4">
        <Button
          type="button"
          variant="inverse"
          disabled
          className="w-full"
          /* Désactivé plutôt qu'absent : le parcours doit se voir jusqu'au bout,
             c'est lui qu'on présente. Mais rien derrière ne serait honnête — ce
             site n'encaisse aucun paiement, et une fausse page de confirmation
             n'aurait rien appris à personne. */
        >
          {/* « Payer » seul, sans le montant : le total est affiché juste
              au-dessus, en gros et sur sa propre ligne. Le répéter sur le bouton
              donnait deux fois le même chiffre à 2rem d'écart. */}
          Payer
        </Button>

        {/* `text-balance` : sans lui, la phrase se coupait juste avant « réel. »
            et laissait un mot seul sur la seconde ligne. Le navigateur répartit
            désormais le texte sur des lignes de longueur proche. Il ne s'agit
            pas de raccourcir la phrase — elle dit exactement ce qu'il faut. */}
        <p className="text-balance text-center text-paper/40 text-xs leading-relaxed">
          Paiement indisponible : projet d&apos;école, sans encaissement réel.
        </p>

        {!isEmpty && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={clear}
              className="text-paper/70 text-sm decoration-paper/30 hover:decoration-paper"
            >
              Vider le panier
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

/**
 * La ligne perforée qui sépare le détail du montant dû.
 *
 * Les deux encoches sont des disques de la couleur du FOND DE PAGE, posés à
 * cheval sur les bords du panneau : c'est ce qui donne l'illusion d'un billet
 * poinçonné, sans rien découper. Leur décalage — `-left-10`, soit 2.5rem — vaut
 * les 2rem de padding horizontal du panneau plus la moitié du disque.
 *
 * Elles sont donc solidaires de `px-8` sur le panneau et de `bg-paper` sur la
 * section : changer l'un des deux demande de revenir ici.
 */
function Perforation() {
  return (
    <div
      aria-hidden="true"
      className="relative my-6 border-paper/25 border-t border-dashed"
    >
      <span className="-left-10 -translate-y-1/2 absolute top-0 size-4 rounded-full bg-paper" />
      <span className="-right-10 -translate-y-1/2 absolute top-0 size-4 rounded-full bg-paper" />
    </div>
  );
}

interface CartLineRowProps {
  line: CartLine;
  /** Ce que compte la quantité : un billet se compte, une option se répartit. */
  unit: "billet" | "personne";
}

/**
 * Une ligne du récapitulatif.
 *
 * Extraite parce que les tarifs et les options s'affichent exactement pareil —
 * seul le mot qui suit la quantité change. Deux composants presque identiques
 * auraient divergé à la première retouche.
 */
function CartLineRow({ line, unit }: CartLineRowProps) {
  return (
    <li className="flex items-baseline justify-between gap-4 text-sm">
      <span>
        {line.label}
        <span className="block text-paper/50 text-xs">
          {formatPrice(line.unitPrice)} × {line.quantity} {unit}
          {line.quantity > 1 ? "s" : ""}
        </span>
      </span>
      <span className="shrink-0 tabular-nums">{formatPrice(line.total)}</span>
    </li>
  );
}
