"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/layout/Logo";
import { useTransitionStore } from "@/lib/store";

gsap.registerPlugin(useGSAP);

/** Durée d'un tour complet de l'onde, en secondes. Règle la vitesse. */
const CYCLE = 1;

/** Nombre de tours avant que l'intro rende la main. Règle la durée. */
const TURNS = 2;

/** Temps d'arrêt sur le monogramme complet, en secondes, avant la sortie. */
const HOLD = 0.4;

/** Opacité d'un repère éteint. */
const DIM = 0;

/**
 * Durée minimale de l'intro. Dérivée de CYCLE et TURNS, pas réglée à la main :
 * c'est une rotation qu'on regarde, une durée fixe ne veut rien dire sans la
 * vitesse.
 *
 * Si on l'allonge beaucoup, décaler aussi le repli CSS de `[data-intro]` dans
 * globals.css, qui doit rester au-dessus de `TURNS × CYCLE + 1,15 s`.
 */
const MINIMUM_DURATION = TURNS * CYCLE * 1000;

/** Clé de session marquant que l'intro a déjà été jouée dans cet onglet. */
const INTRO_FLAG = "musee:intro-jouee";

/**
 * Next abandonne la navigation client sur toute réponse non-200 et recharge le
 * document entier : le store ne survit pas à une 404, et l'intro se rejouait.
 * D'où ce relais en sessionStorage.
 *
 * Script en ligne et non `useEffect` : le panneau noir fait partie du HTML
 * serveur, un effet ne le retirerait qu'après hydratation, donc après un flash.
 * `type !== "reload"` garde la nuance utile : un F5 volontaire rejoue l'intro.
 */
const SKIP_INTRO_SCRIPT = `try{
var n=performance.getEntriesByType("navigation")[0];
if(sessionStorage.getItem("${INTRO_FLAG}")&&(!n||n.type!=="reload")){document.documentElement.dataset.introDone="1"}
}catch(e){}`;

/**
 * Écran de chargement, une fois par session d'onglet.
 *
 * Rendu côté serveur : le panneau fait partie du premier HTML, sinon on verrait
 * la page une fraction de seconde avant qu'il la couvre.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);

  /** Gardée pour arrêter l'onde plutôt que la laisser révoquer. Voir `kill()`. */
  const wave = useRef<gsap.core.Tween | null>(null);

  const endIntro = useTransitionStore((state) => state.endIntro);

  const [canLeave, setCanLeave] = useState(false);

  /**
   * Distinct de `isIntroRunning` : la page est libérée 0,2 s avant que le
   * panneau ait fini sa course, donc avant qu'il soit démonté.
   */
  const [isPanelUp, setIsPanelUp] = useState(true);

  /** Rend la main à la page et laisse la trace que lira le script en ligne. */
  const release = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_FLAG, "1");
    } catch {
      /* Navigation privée : l'intro se rejouera, sans conséquence. */
    }
    endIntro();
  }, [endIntro]);

  /**
   * Retire le panneau. L'attribut est posé ici et non dans `release` : la règle
   * `html[data-intro-done] [data-intro] { display: none }` escamoterait sinon
   * le panneau au milieu de son ouverture.
   */
  const dismiss = useCallback(() => {
    document.documentElement.dataset.introDone = "1";
    setIsPanelUp(false);
  }, []);

  useEffect(() => {
    if (document.documentElement.dataset.introDone) {
      release();
      dismiss();
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      release();
      dismiss();
      return;
    }

    let cancelled = false;

    const minimum = new Promise((resolve) =>
      window.setTimeout(resolve, MINIMUM_DURATION),
    );

    /* `document.fonts.ready` attend Instrument Serif : sinon le logo change de
       dessin en cours de route et SplitText mesure les titres sur la mauvaise
       police. Couvrir ce moment est la raison d'être du preloader. */
    Promise.all([document.fonts.ready, minimum]).then(() => {
      if (!cancelled) setCanLeave(true);
    });

    return () => {
      cancelled = true;
    };
  }, [release, dismiss]);

  useGSAP(
    () => {
      const panel = root.current;
      if (!panel) return;

      if (!canLeave) {
        const marks = gsap.utils.toArray<SVGGElement>(".intro-mark");
        if (marks.length === 0) return;

        gsap.set(marks, { opacity: DIM });

        /* `repeat`/`yoyo` DANS le stagger : chaque repère se répète
           individuellement, ce qui fait une onde et non un clignotement
           collectif.

           L'étalement total du stagger doit valoir exactement la période d'un
           repère (deux fois sa `duration`), sinon l'onde dérive à chaque tour et
           le motif se désagrège. Les deux sont donc calés sur CYCLE. */
        wave.current = gsap.to(marks, {
          opacity: 1,
          duration: CYCLE / 2,
          ease: "sine.inOut",
          stagger: { each: CYCLE / marks.length, repeat: -1, yoyo: true },
        });

        return;
      }

      /* Arrêtée et non révoquée : les repères restent où l'onde les a laissés. */
      wave.current?.kill();

      gsap
        .timeline({ onComplete: dismiss })
        /* Tous les repères ensemble, sans `stagger` : les rallumer l'un après
           l'autre donnait un tour de plus, plus lent, dont on ne comprenait pas
           la fonction. */
        .to(".intro-mark", {
          opacity: 1,
          duration: 0.25,
          ease: "power2.out",
          overwrite: "auto",
        })
        /* `+=HOLD` en position plutôt qu'un tween vide : rien ne bouge, c'est le
           seul moment où le monogramme existe entier et immobile. */
        .to(
          logo.current,
          {
            scale: 0.9,
            opacity: 0,
            duration: 0.45,
            ease: "power2.in",
          },
          `+=${HOLD}`,
        )
        .to(
          panel,
          {
            clipPath: "inset(0% 0% 100% 0%)",
            duration: 0.7,
            ease: "power4.inOut",
          },
          "-=0.15",
        )
        /* La page est libérée avant la fin du panneau. En `onComplete`, on
           voyait la page entière et immobile PUIS les titres monter : deux temps
           au lieu d'un. */
        .call(release, undefined, "-=0.2");
    },
    /* Pas de `revertOnUpdate` : il restaurerait l'opacité d'origine des repères
       d'un coup. D'où le `kill()` explicite. */
    { scope: root, dependencies: [canLeave] },
  );

  return (
    <>
      {/* Ce panneau couvre l'écran dès le premier HTML et seul JavaScript le
          retire. Deux filets : le <noscript> pour un JS désactivé, le repli CSS
          minuté de globals.css pour un JS présent mais en échec. */}
      <noscript>
        <style>
          {"[data-intro]{display:none}[data-reveal]{animation-delay:0s}"}
        </style>
      </noscript>

      {/* Doit s'exécuter avant le premier affichage, donc plus tôt que React. */}
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: constante du module.
        dangerouslySetInnerHTML={{ __html: SKIP_INTRO_SCRIPT }}
      />

      {isPanelUp && (
        <div
          ref={root}
          data-intro
          aria-hidden="true"
          className="fixed inset-0 z-110 flex items-center justify-center bg-ink-deep text-paper"
        >
          <div ref={logo}>
            <Logo className="size-24" markClassName="intro-mark" />
          </div>
        </div>
      )}
    </>
  );
}
