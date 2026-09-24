"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface ScrollPinProps {
  /** Le bloc à figer — une image, une spirale, un sommaire… */
  children: React.ReactNode;
  /**
   * Distance entre le haut de l'écran et le bloc figé, en pourcentage de la
   * hauteur du viewport : c'est une position à l'écran, pas une cote de
   * maquette. Elle doit rester correcte sur un écran court comme sur un haut.
   */
  offset?: string;
  className?: string;
}

/**
 * Fige son contenu pendant que la colonne voisine défile, puis le relâche : il
 * ne sort jamais de sa section.
 *
 * Deux choses à savoir avant de le réutiliser :
 *
 * 1. c'est le parent direct qui borne l'épinglage — la durée vaut « hauteur du
 *    parent moins hauteur du bloc ». Le parent doit donc être un élément dont la
 *    hauteur est imposée par le contenu d'à côté, typiquement une colonne de
 *    grille ;
 * 2. `pinSpacing: false` : GSAP n'ajoute aucune hauteur au document, la place
 *    étant déjà réservée par la colonne.
 *
 * Une alternative existe en CSS pur (`position: sticky`) et donne un rendu très
 * proche. On passe par GSAP parce que ScrollTrigger se branche ensuite sur la
 * même instance — progression, chapitre actif, animation d'entrée.
 */
export function ScrollPin({
  children,
  offset = "12%",
  className,
}: ScrollPinProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = root.current;
      const column = element?.parentElement;
      if (!element || !column) return;

      ScrollTrigger.create({
        trigger: element,
        start: `top ${offset}`,
        /* Fonction et non valeur : la hauteur dépend du texte, donc des polices
           et de la largeur de la fenêtre. `invalidateOnRefresh` rejoue le calcul
           plutôt que de garder la mesure faite au montage, quand les polices
           n'étaient pas encore appliquées. */
        end: () =>
          `+=${Math.max(column.offsetHeight - element.offsetHeight, 0)}`,
        pin: element,
        pinSpacing: false,
        invalidateOnRefresh: true,
      });
    },
    { scope: root, dependencies: [offset] },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
