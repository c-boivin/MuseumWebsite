"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SignOutButton } from "@/components/account/SignOutButton";
import { TransitionLink as Link } from "@/components/motion/TransitionLink";
import { accountMenu, accountNavigation } from "@/data/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { ACTIVE_UNDERLINE, NavLinks } from "./NavLinks";

/** Le libellé du bouton une fois connecté. Une seule entrée, lue une fois. */
const TRIGGER = accountNavigation.signedIn[0];

/**
 * L'entrée « compte » du Header : un lien « Connexion », ou un menu déroulant
 * une fois connecté.
 *
 * Un menu alors que rien d'autre ne se superpose au contenu sur ce site : c'est
 * une entorse assumée. Le lien unique retenu d'abord mettait la déconnexion au
 * fond d'une page de compte, à deux navigations d'un visiteur qui voulait
 * simplement partir. Le menu reste discret pour tenir le reste de la règle —
 * mêmes filets, aucune ombre, aucune animation d'ouverture.
 *
 * La session est lue côté client : le Header est monté par le root layout, y
 * appeler `headers()` basculerait tout le site en rendu dynamique, les 39 fiches
 * pré-générées comprises. Voir `lib/auth-client.ts` et `account/SessionSync`.
 *
 * Pendant l'attente on affiche « Connexion » : un squelette clignoterait dans le
 * header à chaque page y compris pour les visiteurs sans compte, et n'afficher
 * rien ferait apparaître l'entrée après coup en poussant le panier.
 *
 * Les deux contenus possibles sont rendus dans la même cellule de grille, l'un
 * invisible : sans cette réservation, la bascule décalerait le panier un dixième
 * de seconde après l'arrivée sur chaque page.
 */
export function AccountLink() {
  const { data: session, isPending } = authClient.useSession();
  const isSignedIn = !isPending && session !== null;

  return (
    <div className="grid font-medium text-sm">
      {/* `aria-hidden` ET `inert` : le premier les retire de la lecture d'écran,
          le second empêche d'y arriver au clavier — un chevron invisible qui
          prend le focus serait un arrêt de tabulation sur rien. */}
      <span
        aria-hidden="true"
        inert
        className="invisible col-start-1 row-start-1"
      >
        {accountNavigation.signedOut[0].label}
      </span>
      <span
        aria-hidden="true"
        inert
        className="invisible col-start-1 row-start-1 inline-flex items-center gap-1.5"
      >
        {TRIGGER.label}
        <Chevron />
      </span>

      <div className="col-start-1 row-start-1">
        {isSignedIn ? (
          <AccountMenu />
        ) : (
          <nav aria-label="Compte">
            <NavLinks
              links={accountNavigation.signedOut}
              tone="ink"
              className="flex items-center"
            />
          </nav>
        )}
      </div>
    </div>
  );
}

/**
 * Le menu, isolé pour qu'il ne se monte que connecté : ses écouteurs de
 * fermeture n'ont pas à exister pour un visiteur sans compte.
 */
function AccountMenu() {
  const pathname = usePathname();
  const menuId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  /* Sans ce soulignement, le seul repère indiquant qu'on est dans son espace
     compte disparaîtrait derrière un menu fermé. Même règle que `NavLinks`. */
  const isCurrent =
    pathname === TRIGGER.href || pathname.startsWith(`${TRIGGER.href}/`);

  /* Le panneau de transition retarde le changement de chemin : sans ça le menu
     resterait ouvert par-dessus la page suivante. */
  // biome-ignore lint/correctness/useExhaustiveDependencies: c'est le changement de `pathname` qui ferme, pas son contenu.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      /* Sans ce retour, fermer au clavier laisse le focus sur un élément
         disparu : la tabulation suivante repart du début du document. */
      trigger.current?.focus();
    }

    /* `pointerdown` et non `click` : le clic ne se produit qu'au relâchement,
       donc après que le lien survolé a eu le temps de réagir. */
    function onPointerDown(event: PointerEvent) {
      if (root.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen]);

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        /* `menu` et non `true` : les lecteurs d'écran annoncent alors « menu »
           au lieu d'un simple « développable ». */
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "inline-flex items-center gap-1.5 transition-colors duration-200",
          isCurrent
            ? `text-paper decoration-paper ${ACTIVE_UNDERLINE}`
            : "text-paper/80 hover:text-paper",
        )}
      >
        {TRIGGER.label}
        <Chevron open={isOpen} />
      </button>

      {isOpen && (
        /* `right-0` : le bouton est le dernier élément du header, aligné à
           gauche le menu déborderait de la page. */
        <div
          id={menuId}
          role="menu"
          aria-label={TRIGGER.label}
          className="absolute top-full right-0 mt-3 min-w-44 border border-paper/15 bg-ink-deep py-2"
        >
          {accountMenu.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block px-4 py-2 transition-colors duration-200",
                  isActive
                    ? "text-paper"
                    : "text-paper/70 hover:bg-paper/5 hover:text-paper",
                )}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Le filet sépare ce qui navigue de ce qui agit : se déconnecter
              n'est pas une troisième page, et c'est la seule entrée dont on ne
              revient pas d'un clic sur Précédent. */}
          <div className="my-2 border-paper/15 border-t" />

          <SignOutButton
            role="menuitem"
            className="block w-full px-4 py-2 text-left text-paper/70 no-underline transition-colors duration-200 hover:bg-paper/5 hover:text-paper"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Le chevron du bouton. Même trait que les autres icônes du site, et il pivote à
 * l'ouverture — la seule animation du menu, elle dit dans quel sens ça va.
 */
function Chevron({ open = false }: { open?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      className={cn(
        "size-3.5 transition-transform duration-200",
        open && "rotate-180",
      )}
    >
      <path d="M5 9l7 7 7-7" />
    </svg>
  );
}
