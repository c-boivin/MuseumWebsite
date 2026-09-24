"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { useTransitionStore } from "@/lib/store";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Un token et non une fonction : la prop traverse la frontière serveur/client,
 * et une fonction n'est pas sérialisable.
 */
export type CountFormat = "plain" | "compact";

/**
 * Construits une fois au chargement du module : `Intl.NumberFormat` est coûteux
 * à instancier, et le compteur le rappelle à chaque image.
 */
const FORMATTERS: Record<CountFormat, Intl.NumberFormat> = {
  plain: new Intl.NumberFormat("fr-FR"),
  compact: new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }),
};

interface CountUpProps {
  /** Valeur finale. C'est elle qui est écrite dans le HTML rendu. */
  to: number;
  format?: CountFormat;
  /** Durée du décompte, en secondes. */
  duration?: number;
  className?: string;
}

/**
 * Un nombre qui monte de zéro à sa valeur, une fois, à l'entrée dans le champ.
 *
 * La valeur finale est dans le JSX, et non un « 0 » qu'on animerait : JavaScript
 * coupé ou animations réduites, le visiteur lit le vrai chiffre. Le composant ne
 * le remplace par « 0 » qu'après s'être assuré qu'il saura le faire remonter —
 * un compteur bloqué à zéro sur une page de musée est une information fausse,
 * pas une animation manquante.
 *
 * Les deux gardes du store sont celles de `TextReveal` : sans elles, le décompte
 * se joue derrière le panneau du preloader ou de la transition, et il est
 * terminé quand il s'ouvre.
 *
 * Il écrit dans `textContent` plutôt que de passer par un `useState` : un rendu
 * React par image, sur plusieurs compteurs à la fois, pour du texte sans aucune
 * autre conséquence sur l'arbre.
 */
export function CountUp({
  to,
  format = "plain",
  duration = 1.8,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  const isIntroRunning = useTransitionStore((state) => state.isIntroRunning);
  const isCovered = useTransitionStore((state) => state.phase !== "idle");

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || isIntroRunning || isCovered) return;

      const formatter = FORMATTERS[format];

      /* `matchMedia` et non le garde-fou CSS : GSAP écrit du texte et des styles
         en ligne. Hors de ce bloc, le chiffre rendu par le serveur reste. */
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const counter = { value: 0 };
        el.textContent = formatter.format(0);

        const tween = gsap.to(counter, {
          value: to,
          duration,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = formatter.format(Math.round(counter.value));
          },
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            once: true,
          },
        });

        /* Au démontage comme au passage en animations réduites, on repose la
           valeur finale : sinon un compteur jamais déclenché resterait à zéro. */
        return () => {
          tween.kill();
          el.textContent = formatter.format(to);
        };
      });
    },
    { scope: ref, dependencies: [isIntroRunning, isCovered, to, format] },
  );

  /* Un seul <span>, le `ref` dessus : le compteur écrit dans son `textContent`,
     ce qui efface tout ce qu'il contient — un <span> interne porteur du style
     aurait disparu à la première image.

     `tabular-nums` : sinon le nombre respire pendant le décompte et pousse ce
     qui l'entoure. */
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {FORMATTERS[format].format(to)}
    </span>
  );
}
