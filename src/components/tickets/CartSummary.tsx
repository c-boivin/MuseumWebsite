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
 * Aucune prop : il lit le store, comme `TicketList` juste à côté l'écrit — les
 * deux ne se connaissent pas, ce qui rend la mise en page libre.
 *
 * Il ne stocke rien non plus : `computeCart` recalcule tout à chaque rendu. Un
 * total gardé en mémoire finirait par survivre à un changement de quantité qu'il
 * aurait manqué.
 *
 * Dessiné comme un billet, seul endroit du site où un bloc d'interface prend une
 * forme figurative : sur une page qui ne vend rien pour de vrai, c'est le seul
 * objet que le visiteur repart avec. La perforation sépare ce qu'on a choisi de
 * ce qu'on doit payer, là où le regard doit s'arrêter.
 */
export function CartSummary() {
  const quantities = useCartStore((state) => state.quantities);
  const options = useCartStore((state) => state.options);
  const clear = useCartStore((state) => state.clear);

  /* Il s'efface quand on quitte la page, seul bloc du site à le faire : le
     panneau de transition est noir et monte du bas, le panier est noir, large et
     collé en haut. On ne voyait plus une page qui se fait recouvrir mais un noir
     déjà installé, et la transition paraissait plus longue ici qu'ailleurs.

     Le correctif est pris côté page : c'est elle qui a un bloc de la couleur du
     mur, pas le mur qui est trop lent.

     Sur `leaving` seulement : au retour, l'opacité est déjà revenue à 1 quand le
     panneau se retire. Et en `prefers-reduced-motion` la phase ne quitte jamais
     `idle`. */
  const isLeaving = useTransitionStore((state) => state.phase === "leaving");

  const cart = computeCart(quantities, options);
  const isEmpty = cart.ticketLines.length === 0;

  return (
    /* `sticky` calé sous le header, même calcul que la colonne de filtres : le
       total doit rester visible pendant qu'on parcourt la grille.

       `data-tone="ink"` inverse le contour de focus : sans lui, la tabulation
       jusqu'à « Payer » dessinerait un trait noir sur fond noir. */
    <aside
      /* Cible de l'icône panier du Header. Sans elle, le lien tombait en haut de
         `/billetterie`, sur une accroche plein écran : on cliquait sur son panier
         et on ne le voyait pas. */
      id="panier"
      data-tone="ink"
      /* `scroll-mt` : on arrive sur le bloc, pas collé à son sommet. La valeur
         reprend le token de padding de la section, donc le point d'arrivée suit
         si le rythme change. Il s'ajoute au `scroll-padding-top` du document, ce
         qui vaut aussi bien pour le saut natif de Next que pour Lenis. */
      className={cn(
        "sticky top-[calc(var(--spacing-header)+1.5rem)] scroll-mt-section-sm rounded-lg bg-ink-deep px-8 py-7 text-paper",
        /* 300 ms : la place est rendue bien avant que le mur atteigne le haut de
           l'écran (0,95 s pour couvrir), et le bloc se retire au lieu de
           s'éteindre d'un coup. */
        "transition-opacity duration-300 ease-out",
        isLeaving && "opacity-0",
      )}
    >
      <p className="eyebrow text-paper/50">{site.shortName}</p>

      <Heading as="h2" size="heading" className="mt-2 text-paper">
        Votre panier
      </Heading>

      {isEmpty ? (
        /* C'est la première chose que voit un visiteur en arrivant : à lui de
           dire où cliquer, pas de s'excuser d'être vide. */
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
          {/* Le défilement porte sur les lignes seules : le total et le bouton
              doivent rester visibles, et un `overflow` sur le panneau rognerait
              les encoches de la perforation, qui débordent volontairement. */}
          <ul className="scrollbar-none mt-6 max-h-76 space-y-4 overflow-y-auto">
            {cart.ticketLines.map((line) => (
              <CartLineRow key={line.id} line={line} unit="billet" />
            ))}

            {cart.optionLines.map((line) => (
              <CartLineRow key={line.id} line={line} unit="personne" />
            ))}
          </ul>

          {/* En valeur et pas seulement signalée : « tarif groupe appliqué »
              n'apprend rien, « −90 € » se comprend seul. */}
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
            {/* `title` et non `figure` : ce palier est celui des chiffres mis en
                scène de l'accueil. Ici, à 3.5rem, un total à quatre chiffres
                viendrait buter contre le mot « Total ». */}
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
          /* Désactivé plutôt qu'absent : le parcours doit se voir jusqu'au bout.
             Mais rien derrière ne serait honnête — ce site n'encaisse aucun
             paiement. */
        >
          {/* « Payer » seul : le total est juste au-dessus, en gros. Le répéter
              donnait deux fois le même chiffre à 2rem d'écart. */}
          Payer
        </Button>

        {/* `text-balance` : sans lui, la phrase laissait un mot seul sur la
            seconde ligne. */}
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
 * Les encoches sont des disques de la couleur du fond de page, posés à cheval
 * sur les bords : illusion d'un billet poinçonné, sans rien découper. Leur
 * décalage vaut le padding horizontal du panneau plus la moitié du disque —
 * elles sont donc solidaires de `px-8` ici et de `bg-paper` sur la section.
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
 * Extraite parce que les tarifs et les options s'affichent exactement pareil,
 * seul le mot qui suit la quantité change.
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
