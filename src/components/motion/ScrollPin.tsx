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
   * Distance entre le haut de l'écran et le bloc une fois figé, en pourcentage
   * de la hauteur du viewport.
   *
   * En pourcentage et non en rem : c'est une position À L'ÉCRAN, pas une cote de
   * maquette. Elle doit rester correcte sur un écran court comme sur un écran
   * haut, ce qu'une valeur fixe ne garantit pas.
   */
  offset?: string;
  className?: string;
}

/**
 * Fige son contenu pendant que le reste de la colonne voisine défile.
 *
 * Le bloc reste immobile tant que sa colonne parente n'a pas fini de passer,
 * puis se remet à défiler avec elle — il ne sort donc jamais de sa section.
 *
 * Deux choses à savoir avant de le réutiliser :
 *
 * 1. **C'est le PARENT direct qui borne l'épinglage.** La durée du figeage vaut
 *    « hauteur du parent moins hauteur du bloc ». Le parent doit donc être un
 *    élément dont la hauteur est imposée par le contenu d'à côté — typiquement
 *    une colonne de grille, qui s'étire à la hauteur de sa rangée.
 * 2. **`pinSpacing: false`** : GSAP n'ajoute aucune hauteur au document. La place
 *    est déjà réservée par la colonne, en ajouter décalerait la section suivante.
 *
 * Une alternative existe en CSS pur (`position: sticky`, trois classes et zéro
 * JavaScript) et donne un rendu très proche. On passe par GSAP parce que
 * ScrollTrigger se branche ensuite sur la même instance — progression, bascule
 * de chapitre actif, animation d'entrée — ce que `sticky` ne sait pas faire.
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
        /* Fonction et non valeur : la hauteur de la colonne dépend du texte, donc
           des polices et de la largeur de la fenêtre. `invalidateOnRefresh`
           rejoue ce calcul à chaque recalcul de ScrollTrigger plutôt que de
           garder la mesure faite au montage, quand les polices n'étaient pas
           encore appliquées. */
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
