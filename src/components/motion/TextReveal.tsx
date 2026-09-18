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
 * Révèle un texte ligne par ligne, chaque ligne glissant depuis le bas de son
 * propre masque.
 *
 * Le composant n'impose aucun style : il enveloppe ce qu'on lui donne et se
 * contente de l'animer. C'est ce qui lui permet de servir aussi bien sur un
 * `<h1>` de hero que sur un paragraphe, sans variante.
 *
 * Il est le seul maillon client de la chaîne : la page et la section qui
 * l'utilisent restent des Server Components.
 */
export function TextReveal({
  children,
  stagger = 0.12,
  delay = 0,
  className,
}: TextRevealProps) {
  const root = useRef<HTMLDivElement>(null);

  /**
   * SplitText découpe le texte en mesurant où tombent les retours à la ligne.
   * Tant que Instrument Serif n'est pas appliquée, cette mesure se fait sur la
   * police de repli : les lignes seraient coupées au mauvais endroit, puis
   * décalées une fois la vraie police arrivée. On attend donc les polices, et on
   * déclenche l'animation via une dépendance plutôt que dans un `.then()` — ce
   * qui garde tout le code GSAP synchrone, donc nettoyé par `useGSAP`.
   */
  const [fontsReady, setFontsReady] = useState(false);

  /**
   * SECONDE CONDITION : PLUS RIEN NE DOIT RECOUVRIR L'ÉCRAN.
   *
   * Deux panneaux peuvent masquer la page au moment où elle se monte — celui du
   * preloader au premier chargement, celui de la transition à chaque navigation
   * — et le symptôme est le même dans les deux cas : l'animation se joue
   * DERRIÈRE le panneau et elle est déjà terminée quand il s'ouvre. Le visiteur
   * arrive sur un titre posé et ne voit jamais l'effet.
   *
   * Le piège, c'est que le bug ne se manifeste pas au même moment selon le
   * panneau : celui de l'intro ne se voit qu'en RECHARGEANT une page, celui de
   * la transition ne se voit qu'en NAVIGUANT. On corrige volontiers le premier
   * en croyant en avoir fini.
   *
   * C'est la raison d'être de ces deux valeurs dans le store : un composant
   * d'animation a besoin de savoir qu'un autre occupe encore l'écran, et ils
   * n'ont aucun lien de parenté dans l'arbre.
   *
   * `phase === "idle"` est levé 0,3 s AVANT la fin du panneau de transition
   * (voir PageTransition) : le titre monte donc pendant que le mur achève sa
   * course, au lieu d'attendre poliment qu'il ait disparu.
   */
  const isIntroRunning = useTransitionStore((state) => state.isIntroRunning);
  const isCovered = useTransitionStore((state) => state.phase !== "idle");

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

      const targets = Array.from(el.children);
      if (targets.length === 0) return;

      /**
       * `matchMedia` n'exécute ce bloc que si l'utilisateur n'a pas demandé à
       * réduire les animations. Le garde-fou CSS de `globals.css` ne suffit pas
       * ici : il neutralise les animations CSS, alors que GSAP écrit des styles
       * en ligne, image par image.
       */
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(targets, {
          type: "lines",
          // Enveloppe chaque ligne dans un conteneur overflow:clip. Sans lui,
          // la ligne décalée resterait visible par-dessus le reste du contenu.
          mask: "lines",
          // Nomme les lignes pour pouvoir viser le masque en CSS : GSAP clone la
          // ligne et suffixe ses classes par "-mask", d'où `.reveal-line-mask`.
          // Voir globals.css — sans ça, les jambages sont rognés.
          linesClass: "reveal-line",
        });

        // yPercent et non y : relatif à la hauteur de la ligne, donc juste à
        // toutes les largeurs d'écran malgré le rem fluide.
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

        // Rend le texte au DOM tel qu'il était : indispensable pour le
        // copier-coller et pour les lecteurs d'écran.
        return () => split.revert();
      });

      // L'état initial invisible est posé en CSS pour éviter que le texte
      // apparaisse avant l'hydratation. Maintenant que les lignes sont en place
      // (ou qu'on a renoncé à animer), on rend la main.
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
