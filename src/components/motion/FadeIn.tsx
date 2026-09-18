"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { useTransitionStore } from "@/lib/store";

gsap.registerPlugin(useGSAP);

interface FadeInProps {
  /** Le bloc à faire apparaître. Il est animé D'UN SEUL TENANT. */
  children: React.ReactNode;
  duration?: number;
  /** Retard au démarrage, pour enchaîner deux blocs qui se suivent. */
  delay?: number;
  className?: string;
}

/**
 * Fondu d'arrivée, sur le bloc entier.
 *
 * C'est le pendant simple de `TextReveal` : là où celui-ci découpe un texte et
 * fait monter ses lignes l'une après l'autre, celui-ci prend ce qu'on lui donne
 * et le fait apparaître d'une seule pièce. Les deux sont les deux effets que la
 * roadmap prévoit de réunir un jour derrière un `<Reveal>` à prop unique ; en
 * attendant ils partagent déjà l'essentiel — l'attribut `data-reveal`, l'attente
 * des panneaux, le garde-fou `prefers-reduced-motion`.
 *
 * PAS DE ScrollTrigger ici, à la différence de `TextReveal`. Ce fondu sert des
 * blocs qui tiennent dans le premier écran : attendre qu'ils entrent dans le
 * viewport, c'est attendre un défilement qui n'aura jamais lieu.
 *
 * L'ENSEMBLE PLUTÔT QU'UN STAGGER, et c'est le point : sur un formulaire, faire
 * apparaître les champs l'un après l'autre donne l'impression que la page n'a
 * pas fini de charger — on attend le champ suivant au lieu de remplir le
 * premier. Un fondu simultané pose le formulaire d'un coup.
 */
export function FadeIn({
  children,
  duration = 0.9,
  delay = 0,
  className,
}: FadeInProps) {
  const root = useRef<HTMLDivElement>(null);

  /**
   * ON REPOUSSE LE FILET DÈS QUE CE COMPOSANT EXISTE.
   *
   * Le repli de `globals.css` dévoile le bloc de force au bout d'1,5 s, et il
   * protège d'une panne précise : le JavaScript n'est jamais arrivé. Or si cet
   * effet s'exécute, il est arrivé — le composant est monté, il attend
   * seulement les polices pour mesurer ses lignes. Le délai court n'a donc plus
   * d'objet, et il était en train de gagner la course : le titre apparaissait
   * sans animation, le filet ayant dévoilé le bloc avant GSAP.
   *
   * Un style EN LIGNE plutôt qu'une classe ou un attribut : il bat n'importe
   * quelle règle de la feuille sans qu'on ait à se battre sur la spécificité —
   * et la règle concurrente, `html[data-intro-done] [data-reveal]`, est
   * précisément de celles qu'on ne bat pas avec un simple sélecteur d'attribut.
   *
   * Le filet n'est pas SUPPRIMÉ, seulement reporté : si GSAP échoue en cours de
   * route, le bloc réapparaît quand même. 10 s, c'est-à-dire après le repli du
   * preloader (8 s) — dans cet ordre, sinon le titre se dévoilerait derrière un
   * panneau d'intro encore à l'écran.
   */
  useEffect(() => {
    const el = root.current;
    if (!el) return;

    /* SAUF SI LE FILET A DÉJÀ JOUÉ — hydratation plus lente que son délai. Le
       repousser relancerait son minutage : pendant la nouvelle attente, le bloc
       repasserait à l'opacité que lui impose `[data-reveal]`, c'est-à-dire zéro.
       Le titre disparaîtrait de l'écran pour dix secondes. On ne touche donc à
       rien une fois qu'il est dévoilé ; `useGSAP` verra la même chose et
       renoncera à animer. */
    if (getComputedStyle(el).opacity !== "0") return;

    el.style.animationDelay = "10s";
  }, []);

  /* Même attente que TextReveal, et pour la même raison : le panneau du
     preloader comme celui de la transition recouvrent l'écran. Sans ces deux
     conditions, le fondu se joue DERRIÈRE le panneau et il est terminé quand
     celui-ci s'ouvre — on arrive sur un formulaire déjà posé. Le détail du
     piège est commenté dans `motion/TextReveal`. */
  const isIntroRunning = useTransitionStore((state) => state.isIntroRunning);
  const isCovered = useTransitionStore((state) => state.phase !== "idle");

  useGSAP(
    () => {
      const el = root.current;
      if (!el || isIntroRunning || isCovered) return;

      /**
       * LE REPLI CSS A-T-IL DÉJÀ RÉVÉLÉ LE BLOC ? Alors on n'anime plus.
       *
       * `[data-reveal]` garde le bloc invisible, et `globals.css` le dévoile de
       * force au bout d'un délai — 1,5 s quand l'intro est passée, 5 s pendant.
       * Ce repli existe pour la panne : JavaScript absent ou en erreur, la page
       * doit rester lisible.
       *
       * Mais RIEN N'EMPÊCHAIT LES DEUX DE JOUER. Quand l'hydratation ou le
       * chargement des polices dépasse le délai, le repli montre le titre, puis
       * GSAP arrive, le redécoupe, le remet à zéro et le rejoue : à l'écran, la
       * page s'affiche fixe puis se réanime toute seule — on croit à un
       * rechargement. C'est le symptôme signalé, et il empire à mesure que le
       * JavaScript du site grossit.
       *
       * L'opacité calculée tranche sans rien mesurer d'autre : tant que le repli
       * n'a pas commencé, elle vaut exactement 0. Dès qu'elle en bouge, il est
       * trop tard pour animer une arrivée — le bloc est déjà arrivé. On se
       * contente alors de retirer l'attribut, et le titre reste où il est.
       */
      if (getComputedStyle(el).opacity !== "0") {
        el.removeAttribute("data-reveal");
        return;
      }

      /* `matchMedia` et non la règle CSS de globals.css : celle-ci neutralise
         les animations CSS, alors que GSAP écrit des styles en ligne. */
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          el,
          { opacity: 0 },
          { opacity: 1, duration, delay, ease: "power2.out" },
        );
      });

      /* L'état invisible de départ est posé en CSS (`[data-reveal]`), pour que
         rien n'apparaisse avant l'hydratation. On rend la main maintenant que
         GSAP a pris le relais — ou qu'on a renoncé à animer. */
      el.removeAttribute("data-reveal");
    },
    { scope: root, dependencies: [isIntroRunning, isCovered] },
  );

  return (
    <div ref={root} data-reveal className={className}>
      {children}
    </div>
  );
}
