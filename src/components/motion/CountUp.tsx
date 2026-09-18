"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { useTransitionStore } from "@/lib/store";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Mise en forme du nombre. Un TOKEN et non une fonction, parce que la prop
 * traverse la frontière serveur / client : une fonction n'est pas sérialisable
 * et Next refuserait de la passer depuis un Server Component.
 */
export type CountFormat = "plain" | "compact";

/**
 * Les formateurs sont construits une fois pour toutes, au chargement du module :
 * `Intl.NumberFormat` est coûteux à instancier, et le compteur le rappelle à
 * chaque image.
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
 * POURQUOI LA VALEUR FINALE EST DANS LE JSX, et non un « 0 » qu'on animerait.
 * C'est le HTML rendu côté serveur : JavaScript coupé, script en erreur ou
 * animations réduites, le visiteur lit le vrai chiffre. Le composant ne
 * remplace ce texte par « 0 » qu'APRÈS s'être assuré qu'il saura le faire
 * remonter — même principe que le `data-cursor-on` du curseur ou que le panneau
 * du preloader : la panne tombe du bon côté. Un compteur bloqué à zéro sur une
 * page de musée, c'est une information fausse, pas une animation manquante.
 *
 * LES DEUX GARDES DU STORE sont celles de `TextReveal`, pour la même raison
 * exactement : au premier chargement le panneau du preloader couvre l'écran, et
 * à chaque navigation celui de la transition. Sans elles, le décompte se joue
 * derrière le panneau et il est terminé quand il s'ouvre — le visiteur arrive
 * sur un nombre posé et ne voit jamais rien. Le piège est que le défaut ne se
 * voit qu'en RECHARGEANT pour l'un, qu'en NAVIGUANT pour l'autre.
 *
 * Il écrit dans le DOM (`textContent`) au lieu de passer par un `useState` : un
 * rendu React par image, soixante fois par seconde et sur plusieurs compteurs à
 * la fois, pour du texte qui n'a aucune autre conséquence sur l'arbre.
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

      /* `matchMedia` et non le garde-fou CSS de `globals.css` : celui-ci
         neutralise les animations CSS, alors que GSAP écrit du texte et des
         styles en ligne, image par image. Hors de ce bloc, rien ne se passe et
         le chiffre rendu par le serveur reste en place. */
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
           valeur finale : sans ça, un compteur qui n'a jamais été déclenché
           resterait affiché à zéro. */
        return () => {
          tween.kill();
          el.textContent = formatter.format(to);
        };
      });
    },
    { scope: ref, dependencies: [isIntroRunning, isCovered, to, format] },
  );

  /* UN SEUL <span>, et le `ref` dessus : le compteur écrit dans son
     `textContent`, ce qui efface tout ce qu'il contient. Un <span> interne
     porteur du style aurait disparu à la première image.

     `tabular-nums` : les chiffres gardent la même chasse d'une image à l'autre,
     sinon le nombre respire pendant tout le décompte et pousse ce qui
     l'entoure. */
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {FORMATTERS[format].format(to)}
    </span>
  );
}
