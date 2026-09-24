"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { useTransitionStore } from "@/lib/store";

gsap.registerPlugin(useGSAP);

/**
 * Les deux états du curseur : un diamètre et un remplissage.
 *
 * `size` en rem comme le reste du site, sinon le curseur serait le seul élément
 * à ne pas suivre le rem fluide de globals.css.
 *
 * Le cercle a toujours sa bordure ; `fill` est l'opacité du disque qui la
 * recouvre. Au survol le point ne grossit donc pas, il s'ouvre — un disque plein
 * de 24 px masquerait ce qu'on est en train de pointer.
 */
const STATES = {
  idle: { size: 0.375, fill: 1 },
  hot: { size: 1.5, fill: 0 },
} as const;

type CursorState = keyof typeof STATES;

/**
 * Le clic contracte le cercle quel que soit son état, plutôt que de lui imposer
 * un troisième diamètre : en absolu, un clic dans le vide faisait GROSSIR le
 * point, là où un appui doit s'enfoncer.
 */
const PRESS_SCALE = 0.72;

/**
 * Ce qui fait réagir le curseur. Un sélecteur plutôt qu'un attribut à poser
 * composant par composant, qui serait une seconde source de vérité à tenir.
 */
const TARGETS =
  'a, button, [role="button"], label, summary, select, input, textarea';

/**
 * Champs de saisie : le curseur s'efface, le caret du système reprend la main
 * (l'autre moitié de la règle est dans globals.css). Cases à cocher et boutons
 * radio exclus — ce sont des `input`, mais ils se comportent comme des boutons.
 */
const TEXT_FIELDS =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]), textarea, [contenteditable="true"]';

/**
 * Zones qui dessinent déjà leur propre curseur, `ui/GlassLens` aujourd'hui : le
 * point venait se poser au centre de la loupe, sur le détail qu'elle agrandit.
 * `cursor: none` y reste actif — on retire notre point, on ne rend pas la flèche.
 */
const HIDDEN_ZONES = "[data-cursor-hidden]";

/**
 * Le curseur du site : un disque noir de 6 px, qui s'ouvre en anneau de 24 px
 * sur tout ce qui est cliquable.
 *
 * Aucun retard sur la position, contrairement à l'effet habituel : remplacer le
 * curseur système revient à retirer le seul repère de précision de
 * l'utilisateur, et ce site demande de viser des vignettes et des cases à
 * cocher. Seuls les changements d'état sont animés.
 *
 * `cursor: none` n'est pas écrit en dur dans globals.css : il dépend de
 * `data-cursor-on`, que ce composant pose lui-même une fois sûr de pouvoir
 * dessiner un remplaçant. JS désactivé, écran tactile, `prefers-reduced-motion` :
 * l'attribut n'arrive jamais et le curseur système n'a jamais disparu.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);

  /**
   * Les panneaux plein écran recouvrent le `[data-tone="ink"]` du Header sur
   * lequel s'appuie la détection de fond. La détection est branchée sur
   * `pointerover`, qui ne se déclenche qu'au changement d'élément : un panneau
   * qui se retire sous une souris immobile ne déclenche rien. D'où la lecture du
   * store, et le recalcul explicite.
   */
  const isIntroRunning = useTransitionStore((state) => state.isIntroRunning);
  const isCovered = useTransitionStore((state) => state.phase !== "idle");
  const isOverPanel = isIntroRunning || isCovered;

  /**
   * Passerelle entre React et l'effet GSAP. Pas `dependencies: [isOverPanel]` :
   * l'effet entier serait rejoué à chaque navigation, donc `data-cursor-on`
   * retiré puis reposé et tous les écouteurs rebranchés, pour un booléen.
   */
  const overPanelRef = useRef(false);
  const refreshTone = useRef<(() => void) | null>(null);

  /**
   * Pendant l'intro, aucun curseur : sous le panneau il n'y a rien à pointer.
   * Séparé de `overPanelRef`, qui couvre aussi le panneau de transition — là, le
   * point doit rester visible, c'est lui qui confirme que le clic a été pris.
   */
  const introRef = useRef(true);
  const refreshVisibility = useRef<(() => void) | null>(null);

  useEffect(() => {
    overPanelRef.current = isOverPanel;
    refreshTone.current?.();
  }, [isOverPanel]);

  useEffect(() => {
    introRef.current = isIntroRunning;
    refreshVisibility.current?.();
  }, [isIntroRunning]);

  useGSAP(
    () => {
      const layer = root.current;
      const ringEl = ring.current;
      const fillEl = fill.current;
      if (!layer || !ringEl || !fillEl) return;

      /* `matchMedia` et non une règle CSS : il ne s'agit pas d'atténuer une
         animation mais de ne pas remplacer le curseur du tout. */
      const mm = gsap.matchMedia();

      mm.add(
        "(pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          /* Le curseur système ne disparaît qu'ici, une fois qu'on sait qu'un
             remplaçant va être dessiné. */
          document.documentElement.dataset.cursorOn = "";

          /* Centrage posé par GSAP : il réécrit `transform` entier quand il anime
             `x`/`y`, une classe `-translate-x-1/2` serait écrasée. En pourcentage,
             le cercle reste centré pendant qu'il passe de 6 à 24 px. */
          gsap.set(ringEl, { xPercent: -50, yPercent: -50 });

          /* `quickSetter` : la version sans tween, faite pour être appelée à
             chaque frame. La position n'est pas animée, elle est écrite. */
          const setX = gsap.quickSetter(ringEl, "x", "px") as (
            value: number,
          ) => void;
          const setY = gsap.quickSetter(ringEl, "y", "px") as (
            value: number,
          ) => void;

          /* Variables locales et non `useState` : elles changent à chaque survol
             et à chaque clic, sans jamais changer une ligne de JSX. */
          let visible = false;
          let suppressed = false;
          let pressed = false;
          let state: CursorState = "idle";

          /** Position connue, pour `refreshTone` : -1 tant que rien n'a bougé. */
          let lastX = -1;
          let lastY = -1;

          const sync = () => {
            gsap.to(layer, {
              autoAlpha: visible && !suppressed && !introRef.current ? 1 : 0,
              duration: 0.2,
              overwrite: "auto",
            });
          };

          /* L'intro se retire sans qu'aucun événement de souris ne se produise.
             Sans ce rappel, le visiteur qui a bougé la souris pendant l'intro
             garderait son curseur effacé jusqu'au mouvement suivant. */
          refreshVisibility.current = sync;

          /**
           * Fond sombre : un curseur noir y serait invisible. On réutilise le
           * `data-tone="ink"` du Header, du Footer et des Section inversées, qui
           * répond déjà à la même question. Les panneaux passent avant le DOM :
           * ils recouvrent tout, l'élément survolé ne dit plus rien du fond.
           */
          const setTone = (element: Element | null) => {
            layer.dataset.tone =
              overPanelRef.current || element?.closest('[data-tone="ink"]')
                ? "ink"
                : "paper";
          };

          /* `elementFromPoint` ignore le curseur, qui est en `pointer-events:
             none` : il rend bien l'élément de la page. */
          refreshTone.current = () => {
            setTone(lastX < 0 ? null : document.elementFromPoint(lastX, lastY));
          };

          const apply = () => {
            const { size, fill: fillOpacity } = STATES[state];
            const diameter = pressed ? size * PRESS_SCALE : size;

            gsap.to(ringEl, {
              width: `${diameter}rem`,
              height: `${diameter}rem`,
              duration: 0.35,
              ease: "power3.out",
              overwrite: "auto",
            });
            gsap.to(fillEl, {
              opacity: fillOpacity,
              duration: 0.35,
              ease: "power3.out",
              overwrite: "auto",
            });
          };

          const onMove = (event: PointerEvent) => {
            setX(event.clientX);
            setY(event.clientY);

            lastX = event.clientX;
            lastY = event.clientY;

            if (!visible) {
              visible = true;
              sync();
            }
          };

          /* `pointerover` et non `pointermove` : il ne se déclenche qu'au
             changement d'élément survolé. Un `closest()` par pixel parcouru
             serait du travail jeté soixante fois par seconde. */
          const onOver = (event: PointerEvent) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            setTone(target);

            const hit = target.closest<HTMLElement>(TARGETS);

            /* Le test des zones porte sur l'élément survolé et non sur `hit`,
               qui ne remonte qu'aux éléments interactifs : la loupe n'en est pas. */
            suppressed =
              target.closest(HIDDEN_ZONES) !== null ||
              (hit?.matches(TEXT_FIELDS) ?? false);
            sync();

            state = hit && !suppressed ? "hot" : "idle";
            apply();
          };

          const onDown = () => {
            pressed = true;
            apply();
          };

          const onUp = () => {
            pressed = false;
            apply();
          };

          /* Sans ça, le point resterait figé sur le bord de la fenêtre, à côté du
             curseur système redevenu visible. */
          const onLeave = () => {
            visible = false;
            sync();
          };

          window.addEventListener("pointermove", onMove, { passive: true });
          window.addEventListener("pointerover", onOver, { passive: true });
          window.addEventListener("pointerdown", onDown, { passive: true });
          window.addEventListener("pointerup", onUp, { passive: true });
          document.addEventListener("mouseleave", onLeave);

          apply();

          return () => {
            /* Rendre le curseur système en premier : si le nettoyage
               s'interrompait, mieux vaut un point orphelin qu'aucun curseur. */
            delete document.documentElement.dataset.cursorOn;
            refreshTone.current = null;
            refreshVisibility.current = null;
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerover", onOver);
            window.removeEventListener("pointerdown", onDown);
            window.removeEventListener("pointerup", onUp);
            document.removeEventListener("mouseleave", onLeave);
          };
        },
      );

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    /* `pointer-events-none` sinon le curseur se survole lui-même et aucun lien
       n'est jamais détecté. z-200 : au-dessus du preloader et du panneau de
       transition, sans quoi il passerait derrière.

       `visibility: hidden` en ligne et non par une classe : la couche doit être
       invisible dès le premier octet de HTML, sinon le point se dessine en 0,0
       en attendant le premier mouvement.

       `data-tone` n'est qu'une valeur de départ : `setTone` en est la seule
       autorité. Piloté par React, il serait réécrit à chaque rendu. */
    <div
      ref={root}
      aria-hidden="true"
      data-tone="paper"
      style={{ visibility: "hidden" }}
      className="pointer-events-none fixed inset-0 z-200 text-ink data-[tone=ink]:text-paper"
    >
      {/* La bordure est là à tous les états ; au repos le disque la recouvre
          exactement. La faire apparaître au survol aurait demandé d'animer une
          épaisseur, donc de la voir grossir.

          Aucune taille en CSS : le diamètre est piloté par GSAP (voir STATES). */}
      <span
        ref={ring}
        className="absolute top-0 left-0 block rounded-full border border-current"
      >
        <span
          ref={fill}
          className="absolute inset-0 block rounded-full bg-current"
        />
      </span>
    </div>
  );
}
