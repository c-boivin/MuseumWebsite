"use client";

import gsap from "gsap";
import {
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { cn } from "@/lib/cn";

/**
 * Le rem du site est fluide (`calc(100vw / 1440 * 16)`), donc 1rem ne vaut pas
 * 16px. Les calculs ci-dessous travaillent sur des mesures du DOM, en pixels.
 */
function remToPx(rem: number): number {
  return (
    rem * Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  );
}

interface GlassLensProps {
  children: ReactNode;
  /**
   * Diamètre en rem. Réglage d'équilibre : trop grande, la loupe cache la bande
   * qu'elle est censée aider à regarder ; trop petite, on ne voit plus assez de
   * matière peinte pour que le grossissement dise quelque chose.
   */
  size?: number;
  /** Grossissement. Au-delà de 2, la reproduction devient floue. */
  zoom?: number;
  /** Retard du suivi du curseur, en secondes : c'est lui qui donne le poids du verre. */
  duration?: number;
  className?: string;
}

/**
 * Loupe de verre qui suit le curseur et grossit ce qu'elle survole.
 *
 * C'est le geste qu'on fait devant une toile : s'approcher pour voir la touche.
 * Sur un détail de Monet, dont le sujet EST la matière peinte, l'effet dit
 * quelque chose au lieu de faire joli.
 *
 * Pas three.js : la version React Bits de cet effet fait de la vraie réfraction
 * avec @react-three/fiber, three et un modèle 3D — environ 1 Mo sur l'accueil,
 * et surtout la reproduction rendue dans un canvas WebGL, donc sans balise <img>,
 * sans texte alternatif et sans next/image. Sur un musée qui vise le RGAA AA, le
 * compte n'y était pas.
 *
 * Ce n'est pas un filtre : la loupe contient une SECONDE copie du contenu,
 * agrandie et décalée pour que le point survolé reste sous le curseur — mise à
 * l'échelle z, puis décalage `rayon - point × z`. Le reste (anneau, reflet,
 * ombre) est du CSS, et c'est lui qui fait lire le disque comme du verre.
 *
 * Souris uniquement : au doigt il n'y a pas de survol, la loupe apparaîtrait
 * sous le contact et ne partirait plus.
 */
export function GlassLens({
  children,
  size = 10,
  zoom = 1.7,
  duration = 0.35,
  className,
}: GlassLensProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  /* Dans une ref et non un state : la position change à chaque image, un rendu
     React par frame serait du gaspillage pur. */
  const point = useRef({ x: 0, y: 0 });
  const radius = useRef(0);

  /** Écrit la position de la loupe et le décalage de la copie agrandie. */
  const apply = useCallback(() => {
    const lens = lensRef.current;
    const inner = innerRef.current;
    if (!lens || !inner) return;

    const r = radius.current;
    const { x, y } = point.current;

    /* La loupe est centrée sur le point survolé… */
    lens.style.left = `${x - r}px`;
    lens.style.top = `${y - r}px`;

    /* …et la copie agrandie décalée pour que ce point tombe au centre du disque :
       avec `origin-top-left`, un point (x, y) se retrouve en (x·z, y·z). */
    inner.style.left = `${r - x * zoom}px`;
    inner.style.top = `${r - y * zoom}px`;
  }, [zoom]);

  /* La copie doit faire la taille du conteneur, et le diamètre dépend du rem
     donc de la largeur de l'écran : les deux se remesurent au redimensionnement. */
  useEffect(() => {
    const root = rootRef.current;
    const lens = lensRef.current;
    const inner = innerRef.current;
    if (!root || !lens || !inner) return;

    const measure = () => {
      const rect = root.getBoundingClientRect();
      const diameter = remToPx(size);

      radius.current = diameter / 2;
      lens.style.width = `${diameter}px`;
      lens.style.height = `${diameter}px`;
      inner.style.width = `${rect.width}px`;
      inner.style.height = `${rect.height}px`;
      apply();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [apply, size]);

  /* Les tweens survivraient au démontage et animeraient des nœuds détachés. */
  useEffect(
    () => () => {
      gsap.killTweensOf([point.current, lensRef.current]);
    },
    [],
  );

  function localPoint(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function handleEnter(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;

    /* Posée sans animation : sinon la loupe traverserait l'image depuis sa
       dernière position connue avant d'arriver sous le curseur. */
    point.current = localPoint(event);
    apply();

    gsap.to(lensRef.current, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
      overwrite: true,
    });
  }

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;

    /* Lu ici et non au rendu : `window` n'existe pas sur le serveur. */
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const { x, y } = localPoint(event);

    /* On anime l'objet, pas le DOM : `onUpdate` recalcule les deux positions
       ensemble. Les animer séparément les désynchroniserait, et le contenu
       grossi glisserait dans son disque. */
    gsap.to(point.current, {
      x,
      y,
      duration: prefersReduced ? 0 : duration,
      ease: "power3.out",
      overwrite: true,
      onUpdate: apply,
    });
  }

  function handleLeave(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;

    gsap.to(lensRef.current, {
      autoAlpha: 0,
      scale: 0.85,
      duration: 0.25,
      ease: "power2.in",
      overwrite: true,
    });
  }

  return (
    /* `data-cursor-hidden` : le point de `motion/Cursor` s'efface sur la loupe,
       qui EST déjà un curseur — le point venait se poser en plein milieu de la
       lentille, là où l'on regarde le détail agrandi.

       Posé ici et non sur les appelants : c'est la loupe qui sait qu'elle dessine
       son propre curseur. Celui du système reste masqué, c'est bien la loupe qui
       tient ce rôle. */
    <div
      ref={rootRef}
      data-cursor-hidden
      className={cn("relative overflow-hidden", className)}
      onPointerEnter={handleEnter}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {children}

      {/* `invisible opacity-0` en état initial : le HTML est rendu par le
          serveur, donc peint avant GSAP. Sans ça, la loupe apparaîtrait une
          fraction de seconde dans le coin haut-gauche. */}
      <div
        ref={lensRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute overflow-hidden rounded-full opacity-0"
        style={{ willChange: "left, top, transform" }}
      >
        <div
          ref={innerRef}
          className="absolute origin-top-left"
          style={{ transform: `scale(${zoom})` }}
        >
          {children}
        </div>

        {/* Quatre couches : le filet clair dessine le bord, le halo haut et
            l'ombre basse donnent l'épaisseur, l'ombre portée décolle de la toile.

            Toutes les couleurs passent par `color-mix` sur les tokens — aucune
            valeur de couleur en dur dans un composant — et les distances sont en
            rem pour suivre l'échelle fluide. */}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: [
              "inset 0 0 0 0.0625rem color-mix(in srgb, var(--color-paper) 65%, transparent)",
              "inset 0 0.75rem 2rem color-mix(in srgb, var(--color-paper) 18%, transparent)",
              "inset 0 -0.75rem 2rem color-mix(in srgb, var(--color-ink) 18%, transparent)",
              "0 1.25rem 2.5rem color-mix(in srgb, var(--color-ink) 22%, transparent)",
            ].join(", "),
            background:
              "radial-gradient(120% 120% at 30% 25%, color-mix(in srgb, var(--color-paper) 26%, transparent) 0%, transparent 55%)",
          }}
        />
      </div>
    </div>
  );
}
