"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { useTransitionStore } from "@/lib/store";

gsap.registerPlugin(useGSAP);

interface FadeInProps {
  /** Le bloc à faire apparaître. Il est animé d'un seul tenant. */
  children: React.ReactNode;
  duration?: number;
  /** Retard au démarrage, pour enchaîner deux blocs qui se suivent. */
  delay?: number;
  className?: string;
}

/**
 * Fondu d'arrivée, sur le bloc entier. Pendant simple de `TextReveal`, dont il
 * partage l'attribut `data-reveal`, l'attente des panneaux et le garde-fou
 * `prefers-reduced-motion`.
 *
 * Pas de ScrollTrigger : ce fondu sert des blocs qui tiennent dans le premier
 * écran, attendre qu'ils entrent dans le viewport serait attendre un défilement
 * qui n'aura jamais lieu.
 *
 * L'ensemble plutôt qu'un stagger : sur un formulaire, des champs qui
 * apparaissent l'un après l'autre donnent l'impression que la page n'a pas fini
 * de charger.
 */
export function FadeIn({
  children,
  duration = 0.9,
  delay = 0,
  className,
}: FadeInProps) {
  const root = useRef<HTMLDivElement>(null);

  /**
   * Repousse le filet de globals.css, qui dévoile le bloc de force au bout
   * d'1,5 s pour le cas où JavaScript n'arriverait jamais. Si cet effet
   * s'exécute, il est arrivé, et le délai court gagnait la course.
   *
   * Style en ligne plutôt qu'une classe : il bat `html[data-intro-done]
   * [data-reveal]` sans bataille de spécificité. Reporté et non supprimé, à 10 s
   * — après le repli du preloader (8 s). Voir `motion/TextReveal`.
   */
  useEffect(() => {
    const el = root.current;
    if (!el) return;

    /* Sauf si le filet a déjà joué : le repousser relancerait son minutage et le
       bloc repasserait à l'opacité zéro pour dix secondes. */
    if (getComputedStyle(el).opacity !== "0") return;

    el.style.animationDelay = "10s";
  }, []);

  /* Même attente que TextReveal : sans ces deux conditions, le fondu se joue
     derrière le panneau et il est terminé quand celui-ci s'ouvre. */
  const isIntroRunning = useTransitionStore((state) => state.isIntroRunning);
  const isCovered = useTransitionStore((state) => state.phase !== "idle");

  useGSAP(
    () => {
      const el = root.current;
      if (!el || isIntroRunning || isCovered) return;

      /* Si le repli CSS a déjà révélé le bloc, on n'anime plus : sinon GSAP le
         remet à zéro et le rejoue, et la page semble se recharger toute seule. */
      if (getComputedStyle(el).opacity !== "0") {
        el.removeAttribute("data-reveal");
        return;
      }

      /* `matchMedia` et non la règle CSS : celle-ci neutralise les animations
         CSS, alors que GSAP écrit des styles en ligne. */
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          el,
          { opacity: 0 },
          { opacity: 1, duration, delay, ease: "power2.out" },
        );
      });

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
