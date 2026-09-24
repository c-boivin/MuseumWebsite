"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, useRef, useState } from "react";
import { useTransitionStore } from "@/lib/store";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

interface TextRevealProps {
  /** Le bloc de texte à révéler — un `Heading`, un paragraphe… */
  children: React.ReactNode;
  /** Délai entre chaque ligne. */
  stagger?: number;
  /** Retard au démarrage, pour enchaîner deux blocs qui se suivent. */
  delay?: number;
  className?: string;
}

/**
 * Révèle un texte ligne par ligne, chaque ligne glissant depuis son masque.
 *
 * Le composant n'impose aucun style : il enveloppe ce qu'on lui donne, ce qui
 * lui permet de servir sur un `<h1>` comme sur un paragraphe. Il est le seul
 * maillon client de la chaîne, la page et la section restent des Server
 * Components.
 */
export function TextReveal({
  children,
  stagger = 0.12,
  delay = 0,
  className,
}: TextRevealProps) {
  const root = useRef<HTMLDivElement>(null);

  /**
   * SplitText découpe en mesurant où tombent les retours à la ligne. Tant
   * qu'Instrument Serif n'est pas appliquée, la mesure se fait sur la police de
   * repli et les lignes sont coupées au mauvais endroit. Une dépendance plutôt
   * qu'un `.then()`, pour que le code GSAP reste synchrone donc nettoyé.
   */
  const [fontsReady, setFontsReady] = useState(false);

  /**
   * Seconde condition : plus rien ne doit recouvrir l'écran. Le panneau du
   * preloader et celui de la transition masquent tous deux la page au montage,
   * et l'animation se joue derrière — terminée quand le panneau s'ouvre.
   *
   * Le piège est que les deux ne se manifestent pas au même moment : l'intro en
   * RECHARGEANT, la transition en NAVIGUANT. On corrige le premier en croyant en
   * avoir fini.
   *
   * `phase === "idle"` est levé 0,3 s avant la fin du panneau (voir
   * PageTransition) : le titre monte pendant que le mur achève sa course.
   */
  const isIntroRunning = useTransitionStore((state) => state.isIntroRunning);
  const isCovered = useTransitionStore((state) => state.phase !== "idle");

  /**
   * Repousse le filet de globals.css, qui dévoile le bloc de force au bout
   * d'1,5 s pour le cas où JavaScript n'arriverait jamais. Si cet effet
   * s'exécute, il est arrivé : le délai court n'a plus d'objet et il gagnait la
   * course, le titre apparaissant sans animation.
   *
   * Style en ligne plutôt qu'une classe : il bat `html[data-intro-done]
   * [data-reveal]` sans bataille de spécificité. Reporté et non supprimé, à 10 s
   * — après le repli du preloader (8 s), sinon le titre se dévoilerait derrière
   * un panneau d'intro encore à l'écran.
   */
  useEffect(() => {
    const el = root.current;
    if (!el) return;

    /* Sauf si le filet a déjà joué : le repousser relancerait son minutage et le
       bloc repasserait à l'opacité zéro pour dix secondes. */
    if (getComputedStyle(el).opacity !== "0") return;

    el.style.animationDelay = "10s";
  }, []);

  useEffect(() => {
    let cancelled = false;

    document.fonts.ready.then(() => {
      if (!cancelled) setFontsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || !fontsReady || isIntroRunning || isCovered) return;

      /**
       * Si le repli CSS a déjà révélé le bloc, on n'anime plus. Rien n'empêchait
       * les deux de jouer : quand l'hydratation dépasse le délai, le repli montre
       * le titre, puis GSAP le redécoupe, le remet à zéro et le rejoue — la page
       * s'affiche fixe puis se réanime, on croit à un rechargement.
       *
       * L'opacité calculée tranche : tant que le repli n'a pas commencé, elle
       * vaut exactement 0.
       */
      if (getComputedStyle(el).opacity !== "0") {
        el.removeAttribute("data-reveal");
        return;
      }

      const targets = Array.from(el.children);
      if (targets.length === 0) return;

      /* Le garde-fou CSS ne suffit pas : il neutralise les animations CSS, or
         GSAP écrit des styles en ligne image par image. */
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(targets, {
          type: "lines",
          // Conteneur overflow:clip par ligne, sinon la ligne décalée reste
          // visible par-dessus le reste du contenu.
          mask: "lines",
          // GSAP clone la ligne et suffixe ses classes par "-mask", d'où
          // `.reveal-line-mask` dans globals.css : sans ça les jambages sont
          // rognés.
          linesClass: "reveal-line",
        });

        // yPercent et non y : relatif à la hauteur de la ligne, donc juste à
        // toutes les largeurs malgré le rem fluide.
        gsap.set(split.lines, { yPercent: 110 });

        gsap.to(split.lines, {
          yPercent: 0,
          duration: 1.1,
          delay,
          stagger,
          ease: "power4.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
        });

        // Rend le texte au DOM tel qu'il était : indispensable au copier-coller
        // et aux lecteurs d'écran.
        return () => split.revert();
      });

      el.removeAttribute("data-reveal");
    },
    { scope: root, dependencies: [fontsReady, isIntroRunning, isCovered] },
  );

  return (
    <div ref={root} data-reveal className={className}>
      {children}
    </div>
  );
}
