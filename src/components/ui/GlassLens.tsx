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
 * Convertit une valeur en rem vers des pixels réels.
 *
 * Indispensable ici : le rem du site est fluide (`calc(100vw / 1440 * 16)` dans
 * globals.css), donc 1rem ne vaut PAS 16px. Les calculs ci-dessous travaillent
 * sur des mesures du DOM, qui sont en pixels : il faut convertir avant de
 * mélanger les deux.
 */
function remToPx(rem: number): number {
  return (
    rem * Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  );
}

interface GlassLensProps {
  children: ReactNode;
  /**
   * Diamètre de la loupe, en rem.
   *
   * 10rem = 160px sur la maquette 1440. Réglage d'équilibre, pas de confort :
   * trop grande, la loupe cache la bande qu'elle est censée aider à regarder et
   * ressemble à un calque posé dessus ; trop petite, on ne voit plus assez de
   * matière peinte pour que le grossissement dise quelque chose.
   */
  size?: number;
  /** Grossissement. Au-delà de 2, la reproduction devient floue. */
  zoom?: number;
  /** Retard du suivi du curseur, en secondes. C'est lui qui donne le poids du verre. */
  duration?: number;
  className?: string;
}

/**
 * Loupe de verre qui suit le curseur et grossit ce qu'elle survole.
 *
 * POURQUOI UNE LOUPE ET PAS UN « EFFET DE VERRE » DÉCORATIF. C'est le geste
 * qu'on fait devant une toile : s'approcher pour voir la touche. Sur un détail
 * de Monet, dont le sujet EST la matière peinte, l'effet dit quelque chose au
 * lieu de faire joli — et il donne une raison de survoler l'image.
 *
 * POURQUOI PAS three.js. La version React Bits de cet effet (FluidGlass) fait de
 * la vraie réfraction avec @react-three/fiber, @react-three/drei, three et un
 * modèle 3D : environ 1 Mo de JavaScript sur la page d'accueil, et surtout la
 * reproduction rendue DANS un canvas WebGL — elle perdrait sa balise <img>, donc
 * son texte alternatif et l'optimisation de next/image. Sur un musée qui vise le
 * RGAA AA et dont l'accueil est jugé au LCP, le compte n'y était pas.
 *
 * COMMENT ÇA MARCHE, parce que ce n'est pas un filtre : la loupe contient une
 * SECONDE copie du contenu, agrandie et décalée pour que le point survolé reste
 * exactement sous le curseur. C'est de l'optique de loupe, pas du flou —
 * `mise à l'échelle z`, puis décalage `rayon - point × z`. Le reste (l'anneau,
 * le reflet, l'ombre portée) est du CSS : c'est ce qui fait lire le disque comme
 * du verre plutôt que comme un trou.
 *
 * `aria-hidden` sur la loupe : elle duplique un contenu déjà annoncé. Sans lui,
 * un lecteur d'écran lirait deux fois le même texte alternatif.
 *
 * SOURIS UNIQUEMENT (`pointerType === "mouse"`). Au doigt il n'y a pas de survol
 * : la loupe apparaîtrait sous le contact, masquerait ce qu'on veut voir et ne
 * partirait plus. Le site est de toute façon desktop.
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

  /* Position visée par la loupe, en pixels dans le repère du conteneur. Dans une
     ref et non un state : elle change à chaque image d'animation, un rendu React
     par frame serait du gaspillage pur. */
  const point = useRef({ x: 0, y: 0 });
  const radius = useRef(0);

  /** Écrit la position de la loupe ET le décalage de la copie agrandie. */
  const apply = useCallback(() => {
    const lens = lensRef.current;
    const inner = innerRef.current;
    if (!lens || !inner) return;

    const r = radius.current;
    const { x, y } = point.current;

    /* La loupe est centrée sur le point survolé… */
    lens.style.left = `${x - r}px`;
    lens.style.top = `${y - r}px`;

    /* …et la copie agrandie est décalée pour que ce même point tombe au centre
       du disque. `origin-top-left` + échelle z : un point (x, y) se retrouve en
       (x·z, y·z), qu'on ramène au centre (r, r) en soustrayant. */
    inner.style.left = `${r - x * zoom}px`;
    inner.style.top = `${r - y * zoom}px`;
  }, [zoom]);

  /* La copie agrandie doit faire exactement la taille du conteneur, et le
     diamètre de la loupe dépend du rem, donc de la largeur de l'écran : les deux
     se remesurent à chaque redimensionnement. */
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

  /* Les tweens survivraient au démontage du composant et animeraient des nœuds
     détachés : on les tue avec lui. */
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

    /* On anime l'OBJET, pas le DOM : `onUpdate` recalcule ensuite les deux
       positions ensemble. Les animer séparément les désynchroniserait, et le
       contenu grossi glisserait dans son disque. */
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
    <div
      ref={rootRef}
      className={cn("relative overflow-hidden", className)}
      onPointerEnter={handleEnter}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {children}

      {/* `invisible opacity-0` en état initial : le HTML est rendu par le
          serveur, donc peint avant que GSAP s'exécute. Sans ça, la loupe
          apparaîtrait une fraction de seconde dans le coin haut-gauche. */}
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

        {/* L'ANNEAU DE VERRE. Quatre couches, chacune avec son rôle : le filet
            clair dessine le bord de la lentille, le halo haut et l'ombre basse
            lui donnent une épaisseur, l'ombre portée la décolle de la toile.

            Toutes les couleurs passent par `color-mix` sur les tokens du site —
            règle du projet : aucune valeur de couleur en dur dans un composant.
            Et toutes les distances sont en rem, pour suivre l'échelle fluide. */}
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
