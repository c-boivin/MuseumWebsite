"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, useRef, useState } from "react";

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
      if (!el || !fontsReady) return;

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
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <div ref={root} data-reveal className={className}>
      {children}
    </div>
  );
}
