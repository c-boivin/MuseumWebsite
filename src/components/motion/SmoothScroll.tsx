"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type LenisRef, ReactLenis, useLenis } from "lenis/react";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Défilement amorti sur tout le site (Lenis).
 *
 * Il remplace `scroll-snap-type: y proximity`, que Lenis ne sait pas gérer — son
 * README l'écrit (« no support for CSS scroll-snap ») et le piège est qu'il ne
 * prévient de rien : les règles restent valides, elles n'ont simplement plus
 * d'effet. Arbitrage rendu : on garde le défilement amorti et on abandonne
 * l'aimantation plutôt que de réécrire les points d'arrêt en JavaScript. Les
 * règles ont été retirées de globals.css, les laisser aurait entretenu l'idée
 * qu'elles servent encore.
 *
 * Une seule horloge : Lenis et GSAP ont chacun leur boucle, et deux boucles se
 * décalent de quelques millisecondes — les animations liées au scroll tremblent
 * sans qu'on puisse le reproduire. On coupe celle de Lenis (`autoRaf: false`).
 *
 * `root` : Lenis prend la main sur le scroll du document et ne rend aucun
 * conteneur, ce qui permet de l'intercaler dans le root layout sans toucher à la
 * colonne flex du <body>.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  /* Contrairement à ce que laisse croire `respectReducedMotion`, Lenis 1.3 ne
     lit la préférence que pour ses défilements programmés : l'amortissement de
     la molette reste actif, donc celui qui a demandé moins d'animations garderait
     la seule qui touche à chacun de ses gestes. On coupe `smoothWheel`, ce qui
     rend le scroll natif en laissant Lenis gérer les ancres.

     Lu après le montage : le serveur ne connaît pas la préférence, et un rendu
     différent casserait l'hydratation. */
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    function update(time: number) {
      /* Le ticker compte en secondes, Lenis attend des millisecondes.
         L'instance n'existe qu'après le premier effet de `<ReactLenis>`, d'où
         les `?.`. */
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);
    /* GSAP « rattrape » par défaut les images perdues quand l'onglet a été mis de
       côté. Appliqué au scroll, ce rattrapage fait sauter la page au retour. */
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,
        smoothWheel: !reducedMotion,
        /* Lenis gère les ancres de la page courante en défilement amorti. Sans
           cette option un clic sur une ancre ne ferait plus rien : Lenis tient la
           position et réécrirait celle du navigateur à la frame suivante. Son
           `scrollTo` lit le `scroll-padding-top`, la cible se cale donc sous le
           header comme avant.

           ⚠️ Corollaire : `TransitionLink` passe `scroll={false}` sur ces
           liens-là, sinon Next saute à l'ancre pendant que Lenis l'anime. */
        anchors: true,
        /* Les zones qui ont leur propre ascenseur doivent défiler normalement
           sous la molette. Sans ça, Lenis intercepte le geste au niveau de la
           page et ces zones deviennent impossibles à faire défiler. L'option
           détecte le conteneur survolé — donc pas de `data-lenis-prevent` à
           poser un par un, ni rien à penser pour la prochaine zone. */
        allowNestedScroll: true,
        /* Sinon le défilement continue sur sa lancée derrière le panneau de
           transition, et se termine sur la page suivante. */
        stopInertiaOnNavigate: true,
      }}
    >
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  );
}

/**
 * Recale ScrollTrigger sur la position de Lenis à chaque frame : sans lui,
 * ScrollTrigger n'apprend la position que par l'événement `scroll` du
 * navigateur, émis moins souvent que les frames écrites par Lenis.
 *
 * Composant à part parce que `useLenis` lit un contexte : il doit être rendu
 * SOUS `<ReactLenis>`, pas à côté.
 */
function ScrollTriggerSync() {
  useLenis(() => ScrollTrigger.update());

  return null;
}
