"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { cn } from "@/lib/cn";

gsap.registerPlugin(useGSAP);

interface CircularTextProps {
  /** Texte disposé en cercle. Il tourne en boucle : prévoir un séparateur. */
  text: string;
  /** Durée d'un tour complet, en secondes. */
  spinDuration?: number;
  /** Diamètre du cercle, EN REM — jamais en px, le rem du site est fluide. */
  size?: number;
  className?: string;
}

/**
 * Texte disposé en cercle, en rotation continue.
 *
 * Élément purement décoratif : il est masqué aux lecteurs d'écran, qui liraient
 * sinon une suite de lettres isolées dénuée de sens.
 *
 * Réécrit avec GSAP plutôt qu'avec la librairie d'origine (`motion/react`) : le
 * projet embarque déjà GSAP, et une seconde librairie d'animation pour un seul
 * élément décoratif n'aurait pesé que du côté du poids de page.
 */
export function CircularText({
  text,
  spinDuration = 20,
  size = 12.5,
  className,
}: CircularTextProps) {
  const ring = useRef<HTMLDivElement>(null);

  const letters = Array.from(text);

  useGSAP(
    () => {
      /* `ease: "none"` : une rotation perpétuelle doit être parfaitement
         régulière. Le moindre easing se verrait comme un à-coup à chaque tour.

         Le tween est créé dans useGSAP, donc tué au démontage du composant —
         sans quoi il continuerait de tourner sur un nœud détaché. */
      gsap.to(ring.current, {
        rotation: 360,
        duration: spinDuration,
        ease: "none",
        repeat: -1,
      });
    },
    { scope: ring, dependencies: [spinDuration] },
  );

  return (
    <div
      ref={ring}
      /* `aria-hidden` : lu à voix haute, ce cercle donne « M, u, s, é, e… ».
         Le nom du musée est déjà annoncé ailleurs dans le footer. */
      aria-hidden="true"
      className={cn("relative select-none", className)}
      style={{ width: `${size}rem`, height: `${size}rem` }}
    >
      {letters.map((letter, index) => {
        /* Chaque lettre part du haut du cercle puis pivote à sa place.
           `transform-origin` descendu au centre du cercle (la moitié du
           diamètre) : c'est lui qui transforme la rotation en arc. */
        const angle = (360 / letters.length) * index;

        return (
          <span
            key={`${letter}-${
              // biome-ignore lint/suspicious/noArrayIndexKey: deux lettres identiques ne se distinguent que par leur position sur le cercle
              index
            }`}
            className="absolute top-0 left-1/2 inline-block text-sm uppercase tracking-widest"
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: `0 ${size / 2}rem`,
            }}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
}
