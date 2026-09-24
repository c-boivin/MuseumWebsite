"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { useTransitionStore } from "@/lib/store";

gsap.registerPlugin(useGSAP);

/** Identifiant du `<main>` posé par le root layout, et cible du fondu. */
const CONTENT_ID = "contenu";

/**
 * Adoucit les navigations qui ne passent pas par un lien.
 *
 * Presque tout passe par `motion/TransitionLink`, donc par le panneau noir. Deux
 * parcours y échappent, et ce sont les plus sensibles : la connexion, dont la
 * Server Action termine par un `redirect()`, et la déconnexion. Là, la page
 * change d'un coup, et le contraste est le plus violent du site — on quitte
 * l'écran sombre des pages de compte pour une page claire.
 *
 * Pas le panneau de transition : il a été essayé sur la déconnexion puis retiré,
 * il annonce une salle où l'on entre. Ce composant est le troisième régime,
 * entre le panneau et la coupure sèche — 250 ms, sans voile, sans nom.
 *
 * `phase !== "idle"` signifie qu'une transition est en cours : un fondu
 * par-dessus ferait deux effets pour un seul changement. La vérification est
 * fiable parce que `PageTransition` ne repasse à `idle` qu'à la fin de sa course.
 *
 * `useGSAP` plutôt qu'un `useLayoutEffect` : il pose le fondu avant que le
 * navigateur peigne — sans quoi la page s'afficherait pleine une image puis
 * repartirait de zéro — et `revertOnUpdate` annule proprement si l'on renavigue.
 */
export function SilentArrival() {
  const pathname = usePathname();
  const phase = useTransitionStore((state) => state.phase);

  /* Au premier rendu il vaut le chemin courant : arriver sur le site n'est pas
     une navigation, et le preloader s'en occupe. */
  const previous = useRef(pathname);

  useGSAP(
    () => {
      const from = previous.current;
      previous.current = pathname;

      if (from === pathname) return;
      if (phase !== "idle") return;

      const content = document.getElementById(CONTENT_ID);
      if (!content) return;

      /* `matchMedia` et non la règle CSS : celle-ci neutralise les animations
         CSS, alors que GSAP écrit des styles en ligne. */
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        /* On part de 0.4 et non de 0 : à zéro l'écran passe par un blanc complet
           et le fondu se voit — or il doit précisément ne pas se voir. */
        gsap.fromTo(
          content,
          { opacity: 0.4 },
          { opacity: 1, duration: 0.25, ease: "power1.out" },
        );
      });
    },
    { dependencies: [pathname, phase], revertOnUpdate: true },
  );

  return null;
}
