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
 * ── LE DÉFAUT QU'IL CORRIGE ──
 * Presque toute la navigation du site passe par `motion/TransitionLink`, donc
 * par le panneau noir qui recouvre l'écran : on ne voit jamais l'échange entre
 * deux pages. Deux parcours y échappent, et ce sont justement les plus sensibles :
 * la connexion, dont la Server Action termine par un `redirect()`, et la
 * déconnexion, qui pousse vers l'accueil depuis le navigateur. Là, la page
 * change D'UN COUP — et le contraste est le plus violent du site, puisqu'on
 * quitte l'écran sombre des pages de compte pour une page claire.
 *
 * ── POURQUOI PAS LE PANNEAU DE TRANSITION ──
 * Il a été essayé sur la déconnexion, puis retiré : il annonce une SALLE où l'on
 * entre, or sortir de son compte n'est pas entrer quelque part. Ce composant est
 * le troisième régime, entre le panneau et la coupure sèche — un fondu de 250 ms,
 * sans voile, sans nom, qu'on ne remarque pas mais qui retire la brutalité.
 *
 * ── IL NE SE DÉCLENCHE QUE QUAND PERSONNE D'AUTRE NE S'EN CHARGE ──
 * `phase !== "idle"` signifie qu'une transition est en cours : le panneau couvre
 * déjà l'écran, un fondu par-dessus ferait deux effets pour un seul changement.
 * La vérification est fiable parce que `PageTransition` ne repasse à `idle` qu'à
 * la toute fin de sa course, bien après le changement de chemin.
 *
 * ── `useGSAP` PLUTÔT QU'UN `useLayoutEffect` À LA MAIN ──
 * Il pose le fondu AVANT que le navigateur ne peigne — sans quoi la page
 * s'afficherait pleine une image, puis repartirait de zéro, ce qui serait pire
 * que le défaut d'origine — et il annule proprement l'animation si l'on
 * renavigue au milieu. `revertOnUpdate` fait ce nettoyage à chaque changement de
 * chemin.
 *
 * Il ne rend aucun DOM, comme `motion/ScrollMemoryReset` : il existe pour
 * brancher un effet là où aucun composant visible ne pourrait le porter.
 */
export function SilentArrival() {
  const pathname = usePathname();
  const phase = useTransitionStore((state) => state.phase);

  /* Le chemin d'où l'on vient. Au premier rendu il vaut le chemin courant :
     arriver sur le site n'est pas une navigation, et le preloader s'en occupe. */
  const previous = useRef(pathname);

  useGSAP(
    () => {
      const from = previous.current;
      previous.current = pathname;

      if (from === pathname) return;
      /* Une transition est en cours : son panneau masque déjà l'échange. */
      if (phase !== "idle") return;

      const content = document.getElementById(CONTENT_ID);
      if (!content) return;

      /* `matchMedia` et non la règle CSS de `globals.css` : celle-ci neutralise
         les animations CSS, alors que GSAP écrit des styles en ligne. Même
         garde que `motion/FadeIn`. */
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        /* On part de 0.4 et non de 0 : à zéro, l'écran passe par un blanc
           complet et le fondu se voit — or il doit précisément ne pas se voir.
           À 0.4 l'œil ne perçoit qu'un adoucissement du changement. */
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
