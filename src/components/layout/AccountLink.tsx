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
 * ── POURQUOI UN MENU, ALORS QUE LE SITE NE FAIT RIEN FLOTTER ──
 * C'est une entorse assumée à une règle du projet, et il faut la connaître pour
 * ne pas l'étendre : rien d'autre ne se superpose au contenu ici, et c'est ce
 * qui avait fait abandonner le premier curseur. Un lien unique avait d'abord été
 * retenu pour cette raison. Il déplaçait le problème plus qu'il ne le résolvait :
 * la déconnexion se retrouvait au fond d'une page de compte, donc à deux
 * navigations d'un visiteur qui voulait simplement partir, et rien n'annonçait
 * dans le header qu'il y avait plus d'une page derrière. Le menu regroupe les
 * trois choses qu'on peut vouloir faire de son compte, à l'endroit où l'on
 * pense à son compte.
 *
 * Il reste discret pour tenir le reste de la règle : mêmes filets, mêmes
 * couleurs que le header, aucune ombre portée, aucune animation d'ouverture.
 *
 * ── LA SESSION EST LUE CÔTÉ CLIENT ──
 * Le Header est monté par le root layout : y appeler `headers()` basculerait
 * TOUT le site en rendu dynamique, `/collection` et les 39 fiches pré-générées
 * comprises. Voir `lib/auth-client.ts`, et `account/SessionSync` pour la raison
 * pour laquelle une connexion faite sur le serveur doit être annoncée au
 * navigateur.
 *
 * ── PENDANT L'ATTENTE, ON AFFICHE « CONNEXION » ──
 * `isPending` dure le temps d'un aller-retour. Un squelette clignoterait dans le
 * header à CHAQUE page, y compris pour les visiteurs sans compte, c'est-à-dire
 * presque tous ; n'afficher rien ferait apparaître l'entrée après coup en
 * poussant le panier de côté. L'état déconnecté est le seul qui soit juste pour
 * la majorité et jamais faux bien longtemps pour les autres.
 *
 * ── LA PLACE DU PLUS LARGE EST RÉSERVÉE D'AVANCE ──
 * « Mon compte » et son chevron sont plus larges que « Connexion » : sans
 * réservation, la bascule décalerait le panier vers la gauche un dixième de
 * seconde après l'arrivée sur chaque page. Les deux contenus possibles sont donc
 * rendus dans la MÊME cellule de grille, l'un d'eux invisible — la largeur de la
 * cellule vaut celle du plus large, sans aucune valeur en dur.
 */
export function AccountLink() {
  const { data: session, isPending } = authClient.useSession();
  const isSignedIn = !isPending && session !== null;

  return (
    <div className="grid font-medium text-sm">
      {/* Les deux fantômes de largeur. `aria-hidden` ET `inert`, parce qu'ils ne
          font pas le même travail : le premier les retire de la lecture d'écran,
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
 * Le menu lui-même, isolé pour qu'il ne se monte QUE connecté.
 *
 * Ce n'est pas cosmétique : ses écouteurs de fermeture (clavier, clic à côté) ne
 * doivent pas exister pour un visiteur qui n'a pas de compte.
 */
function AccountMenu() {
  const pathname = usePathname();
  const menuId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  /* LA PAGE COURANTE SOULIGNE LE BOUTON, comme n'importe quelle entrée du
     header : sans ça, le seul repère indiquant qu'on est dans son espace compte
     disparaîtrait derrière un menu fermé. Même règle de correspondance que
     `NavLinks` — `/compte` et tout ce qui vit dessous. */
  const isCurrent =
    pathname === TRIGGER.href || pathname.startsWith(`${TRIGGER.href}/`);

  /* Fermeture sur navigation : le panneau de transition retarde le changement de
     chemin, le menu resterait ouvert par-dessus la page suivante. */
  // biome-ignore lint/correctness/useExhaustiveDependencies: c'est le changement de `pathname` qui ferme, pas son contenu.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      /* LE FOCUS REVIENT AU BOUTON. Sans ça, fermer au clavier laisse le focus
         sur un élément qui vient de disparaître : la tabulation suivante repart
         du début du document, et l'on se retrouve au lien d'évitement. */
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
        /* `menu` et non `true` : la valeur dit CE QUI s'ouvre, et les lecteurs
           d'écran annoncent alors « menu » au lieu d'un simple « développable ». */
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
        /* `right-0` : le menu s'aligne sur le bord DROIT de son bouton, qui est
           lui-même le dernier élément du header. Aligné à gauche, il déborderait
           de la page.

           `top-full` + `mt-3` le décroche du bouton sans le décoller du header :
           il reste visiblement rattaché à ce qui l'a ouvert. */
        <div
          id={menuId}
          role="menu"
          aria-label={TRIGGER.label}
          className="absolute top-full right-0 mt-3 min-w-44 border border-paper/15 bg-ink-deep py-2"
        >
          {accountMenu.map((link) => {
            /* Même règle que `NavLinks` : le chemin lui-même et ses sous-pages.
               Il n'y a plus de cas « exact » à traiter depuis que les deux
               entrées portent leur propre nom — aucune n'est le préfixe de
               l'autre. */
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

          {/* Le filet sépare ce qui NAVIGUE de ce qui AGIT. Se déconnecter n'est
              pas une troisième page, et c'est la seule entrée du menu dont on ne
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
 * Le chevron du bouton.
 *
 * Même trait que les autres icônes du site : 1.5 d'épaisseur, angles nets,
 * `currentColor`, `aria-hidden` puisque le bouton porte déjà son nom. Il pivote
 * à l'ouverture — c'est la seule animation du menu, et elle dit dans quel sens
 * ça va se passer.
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
