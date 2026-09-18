"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { roomLabel } from "@/lib/rooms";
import { useTransitionStore } from "@/lib/store";

interface TransitionLinkProps extends ComponentProps<typeof NextLink> {
  /**
   * Nom de la salle inscrit dans le panneau de transition.
   *
   * Sans lui, le libellé est déduit de l'URL (`lib/rooms.ts`). On le passe
   * explicitement quand l'appelant sait mieux : une carte d'œuvre connaît le
   * titre du tableau, l'URL ne connaît que son slug.
   */
  transitionLabel?: string;
}

/**
 * Le lien du site : un `next/link` qui ANIME avant de naviguer.
 *
 * LE PROBLÈME QU'IL RÉSOUT. Une transition d'entrée est facile — la nouvelle
 * page monte, on l'anime. Une transition de SORTIE ne l'est pas : au clic, le
 * routeur navigue tout de suite et la page qu'on voulait animer n'existe déjà
 * plus. Il n'y a aucun crochet « avant de partir » dans l'App Router. La seule
 * façon d'en obtenir un est de reprendre la main sur le clic, dans cet ordre :
 *
 *   1. savoir où le lien est censé nous amener  → `href`
 *   2. déclencher l'animation de sortie         → `leave()` fait passer le store en "leaving"
 *   3. y aller, mais seulement à la fin         → le `router.push` vit dans `PageTransition`
 *
 * L'étape 3 n'est PAS ici, et c'est délibéré : le lien ne sait pas quand
 * l'animation se termine, seul le composant qui la joue le sait. Le lien se
 * contente de déclarer une intention dans le store.
 *
 * TOUT CE QU'IL LAISSE PASSER SANS Y TOUCHER. Un lien reste un lien : ces cas
 * doivent garder le comportement natif du navigateur, sinon on casse des usages
 * élémentaires pour une animation.
 */
export function TransitionLink({
  href,
  onClick,
  transitionLabel,
  scroll,
  ...props
}: TransitionLinkProps) {
  const pathname = usePathname();
  const leave = useTransitionStore((state) => state.leave);

  const url = typeof href === "string" ? href : (href.pathname ?? "");
  /* Le chemin SEUL d'un côté, l'ancre de l'autre : les deux sont lus plusieurs
     fois, et toujours séparément — c'est le chemin qui dit s'il y a changement
     de page, jamais l'ancre. */
  const [path, hash] = url.split("#");

  /* Ancre visant la page où l'on est déjà : `#tarifs` depuis /billetterie, ou
     `/billetterie#panier` cliqué depuis /billetterie. */
  const isCurrentPageAnchor =
    Boolean(hash) && (path === "" || path === pathname);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    /* Le onClick de l'appelant d'abord : NavLinks s'en sert pour refermer un
       menu. S'il a lui-même annulé l'événement, on ne va pas plus loin. */
    onClick?.(event);
    if (event.defaultPrevented) return;

    /* Ctrl/Cmd/Maj + clic, ou clic milieu : l'utilisateur demande un nouvel
       onglet. Animer une page qu'on ne quitte pas n'aurait aucun sens, et
       `preventDefault` empêcherait purement et simplement l'ouverture. */
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    /* Lien externe ou protocole particulier (mailto:, tel:) : ce n'est pas une
       navigation interne, le routeur n'est pas concerné. */
    if (!url.startsWith("/") || url.startsWith("//")) return;

    /* C'EST LE CHEMIN SEUL QUI DIT S'IL Y A CHANGEMENT DE PAGE, jamais l'ancre
       (calculé en haut du composant). La distinction n'est pas théorique :
       `/a-propos#contact` cliqué DEPUIS /a-propos est un simple défilement, mais
       cliqué depuis l'accueil c'est une vraie navigation, qui doit jouer la
       transition et finir sur l'ancre. Écarter toutes les URL contenant un `#`,
       comme on le faisait, privait de transition les deux liens du Footer et le
       panier du Header. */
    if (path === pathname) {
      /* Ancre dans la page courante : le navigateur fait défiler, on ne touche
         à rien — recouvrir l'écran pour un déplacement de scroll serait absurde.
         Même page SANS ancre : on annule le clic, sinon un clic sur
         « Collection » depuis /collection fermerait le panneau sur exactement la
         même page. */
      if (!hash) event.preventDefault();
      return;
    }

    /* Mouvements réduits : navigation immédiate, sans animation. Le garde-fou
       CSS de globals.css ne suffirait pas, GSAP écrivant des styles en ligne. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    event.preventDefault();
    leave(url, transitionLabel ?? roomLabel(url));
  }

  return (
    <NextLink
      href={href}
      onClick={handleClick}
      /* `scroll={false}` SUR LES SEULES ANCRES DE LA PAGE COURANTE, et c'est ce
         qui les rend utilisables depuis que Lenis amortit le défilement.

         Deux acteurs répondent au même clic. Lenis anime la descente (option
         `anchors`, voir `motion/SmoothScroll`) ; Next, de son côté,
         traite le changement d'ancre comme une navigation et appelle
         `scrollIntoView()` sur la cible
         (`node_modules/next/dist/client/components/layout-router.js`) : un saut
         SEC. Les deux ensemble donnaient un clignotement — la page sautait en
         bas, puis remontait d'un coup là où Lenis en était de son animation,
         qui reprenait sa descente par-dessus.

         `scroll: false` neutralise l'ancre côté routeur sans rien changer au
         reste : l'URL reçoit bien le `#`, l'entrée d'historique est créée, le
         bouton Précédent fonctionne. Seul le saut est retiré — vérifié dans
         `node_modules/next/dist/client/components/segment-cache/navigation.js`,
         où `hashFragment` n'est renseigné que si le scroll est autorisé.

         Les ancres vers une AUTRE page (l'icône panier du Header depuis
         l'accueil) ne sont pas concernées : Lenis ne les traite pas, c'est bien
         Next qui doit y emmener à l'arrivée. */
      scroll={isCurrentPageAnchor ? false : scroll}
      {...props}
    />
  );
}
