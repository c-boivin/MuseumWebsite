"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { roomLabel } from "@/lib/rooms";
import { useTransitionStore } from "@/lib/store";

interface TransitionLinkProps extends ComponentProps<typeof NextLink> {
  /**
   * Nom de la salle inscrit dans le panneau. Sans lui, le libellé est déduit de
   * l'URL (`lib/rooms.ts`). On le passe quand l'appelant sait mieux : une carte
   * d'œuvre connaît le titre du tableau, l'URL ne connaît que son slug.
   */
  transitionLabel?: string;
}

/**
 * Le lien du site : un `next/link` qui anime avant de naviguer.
 *
 * Une transition d'entrée est facile, une transition de SORTIE ne l'est pas : au
 * clic le routeur navigue tout de suite, et il n'y a aucun crochet « avant de
 * partir » dans l'App Router. La seule façon d'en obtenir un est de reprendre la
 * main sur le clic :
 *
 *   1. savoir où le lien mène          → `href`
 *   2. déclencher l'animation de sortie → `leave()` passe le store en "leaving"
 *   3. y aller, à la fin seulement      → le `router.push` vit dans `PageTransition`
 *
 * L'étape 3 n'est pas ici : le lien ne sait pas quand l'animation se termine, il
 * se contente de déclarer une intention dans le store.
 *
 * Tout le reste de ce fichier est ce qu'un lien doit laisser passer sans y
 * toucher — sinon on casse des usages élémentaires pour une animation.
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
  /* Le chemin seul d'un côté, l'ancre de l'autre : c'est le chemin qui dit s'il
     y a changement de page, jamais l'ancre. */
  const [path, hash] = url.split("#");

  /* Ancre visant la page où l'on est déjà. */
  const isCurrentPageAnchor =
    Boolean(hash) && (path === "" || path === pathname);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    /* Le onClick de l'appelant d'abord : NavLinks s'en sert pour refermer un
       menu. S'il a annulé l'événement, on s'arrête. */
    onClick?.(event);
    if (event.defaultPrevented) return;

    /* Ctrl/Cmd/Maj + clic, ou clic milieu : l'utilisateur demande un nouvel
       onglet, et `preventDefault` empêcherait purement et simplement
       l'ouverture. */
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    /* Lien externe ou protocole particulier : le routeur n'est pas concerné. */
    if (!url.startsWith("/") || url.startsWith("//")) return;

    /* `/a-propos#contact` cliqué depuis /a-propos est un simple défilement ;
       cliqué depuis l'accueil c'est une vraie navigation. Écarter toutes les URL
       contenant un `#`, comme on le faisait, privait de transition les deux
       liens du Footer et le panier du Header. */
    if (path === pathname) {
      /* Même page sans ancre : on annule, sinon un clic sur « Collection »
         depuis /collection fermerait le panneau sur la même page. */
      if (!hash) event.preventDefault();
      return;
    }

    /* Mouvements réduits : navigation immédiate. Le garde-fou CSS ne suffirait
       pas, GSAP écrivant des styles en ligne. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    event.preventDefault();
    leave(url, transitionLabel ?? roomLabel(url));
  }

  return (
    <NextLink
      href={href}
      onClick={handleClick}
      /* `scroll={false}` sur les seules ancres de la page courante, depuis que
         Lenis amortit le défilement.

         Deux acteurs répondent au même clic : Lenis anime la descente, Next
         traite le changement d'ancre comme une navigation et appelle
         `scrollIntoView()` — un saut sec. Ensemble, la page sautait en bas puis
         remontait d'un coup au milieu de l'animation.

         `scroll: false` neutralise l'ancre côté routeur sans rien changer au
         reste : l'URL reçoit le `#`, l'historique est créé, le bouton Précédent
         fonctionne. Seul le saut est retiré.

         Les ancres vers une AUTRE page ne sont pas concernées : Lenis ne les
         traite pas, c'est bien Next qui doit y emmener à l'arrivée. */
      scroll={isCurrentPageAnchor ? false : scroll}
      {...props}
    />
  );
}
