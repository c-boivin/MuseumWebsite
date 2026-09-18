"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/layout/Logo";
import { useTransitionStore } from "@/lib/store";

gsap.registerPlugin(useGSAP);

/**
 * Durée d'un tour complet de l'onde autour du cadre, en secondes.
 *
 * C'est le réglage de la VITESSE de l'intro. 1 s pour huit repères fait un
 * huitième de seconde par repère. En l'allongeant, l'œil suit la lumière repère
 * par repère ; en le raccourcissant, on bascule vers le scintillement — en
 * dessous de 0,6 s environ, on ne lit plus une rotation.
 */
const CYCLE = 1;

/**
 * Nombre de tours joués avant que l'intro rende la main.
 *
 * C'est le réglage de la LONGUEUR de l'intro. Séparer les deux est ce qui permet
 * de changer la vitesse sans changer la durée, et l'inverse.
 *
 * DEUX TOURS, ET C'EST LE PLANCHER : le premier sert à comprendre qu'il se passe
 * quelque chose, le deuxième à voir que ça tourne. En dessous, l'écran est
 * reparti avant qu'on ait identifié ce qu'on regardait — c'était le défaut des
 * premiers essais. Au-dessus, on fait patienter pour rien : à trois tours,
 * l'intro durait cinq secondes sur un site qui s'affiche en quelques dizaines de
 * millisecondes, et le troisième tour ne montrait rien que les deux premiers
 * n'aient déjà montré.
 */
const TURNS = 2;

/**
 * Temps d'arrêt sur le monogramme complet, en secondes, une fois l'onde
 * terminée et avant que l'intro se retire.
 *
 * Sans cette pause, l'écran de chargement enchaînait la rotation et la sortie :
 * le logo n'existait jamais entier plus d'une fraction de seconde, et on
 * quittait l'intro sans l'avoir vu. Or c'est LUI le sujet — l'onde n'est là que
 * pour occuper l'attente. La pause inverse l'ordre d'importance : l'animation
 * s'arrête, le cadre est complet, on le regarde, puis on entre.
 *
 * Elle se compte en dixièmes de seconde : il s'agit de marquer un temps, pas
 * d'imposer une contemplation. Au-delà d'une demi-seconde, l'arrêt cesse d'être
 * une respiration et devient une attente.
 */
const HOLD = 0.4;

/** Opacité d'un repère éteint. À 0 le cadre se rompt : la moitié du cadrage
 * disparaît à chaque instant, ce qui accentue la rotation mais fait perdre le
 * dessin du monogramme. Une valeur autour de 0,15 garde les deux lisibles. */
const DIM = 0;

/**
 * Durée minimale du preloader, en millisecondes. DÉRIVÉE, pas réglée à la main.
 *
 * Elle n'est pas là pour faire patienter : elle est là pour que l'animation ait
 * le temps d'exister. Le site est pré-généré et servi depuis un CDN, il s'affiche
 * en quelques dizaines de millisecondes — sans ce plancher, le preloader serait
 * un clignotement noir, c'est-à-dire pire que pas de preloader du tout.
 *
 * ELLE SE COMPTE EN TOURS ET NON EN SECONDES, parce que c'est une rotation qu'on
 * est en train de regarder : une durée fixe ne veut rien dire tant qu'on ne sait
 * pas à quelle vitesse ça tourne. La première version écrivait un nombre de
 * millisecondes en dur à côté d'un `CYCLE` indépendant — et changer la vitesse
 * ne changeait alors PAS la durée, ce qui est exactement le piège qu'on attend
 * de ne pas trouver dans deux constantes voisines.
 *
 * ⚠️ Le repli CSS de `[data-intro]` dans globals.css doit rester au-dessus de
 * `TURNS × CYCLE + 1,15 s` (l'animation de sortie) + le temps de chargement des
 * polices. C'est la seule valeur à décaler à la main si on allonge beaucoup.
 */
const MINIMUM_DURATION = TURNS * CYCLE * 1000;

/** Clé de session marquant que l'intro a déjà été jouée dans cet onglet. */
const INTRO_FLAG = "musee:intro-jouee";

/**
 * Script exécuté PENDANT L'ANALYSE DU HTML, avant le premier affichage.
 *
 * LE BUG QU'IL CORRIGE, et il n'a rien d'évident : le preloader se rejouait en
 * arrivant sur la page 404. Il ne s'agissait pas d'une erreur de notre côté —
 * `isIntroRunning` vit dans le store, le store vit dans le root layout, et le
 * root layout n'est jamais démonté d'une page à l'autre. Sauf que Next, lui,
 * abandonne la navigation côté client dès qu'une réponse n'est pas un 200. Dans
 * `node_modules/next/dist/client/components/router-reducer/fetch-server-response.js` :
 *
 *     // If the fetch was not 200, we also handle it like a mpa navigation
 *     if (!isFlightResponse || !res.ok || !res.body) {
 *         return doMpaNavigation(responseUrl.toString());
 *     }
 *
 * Une 404 provoque donc un rechargement complet du document : nouveau store,
 * nouveau preloader. Le store ne pouvait pas y survivre, il fallait sortir
 * l'information du JavaScript de la page.
 *
 * POURQUOI UN SCRIPT EN LIGNE ET PAS UN `useEffect`. Le panneau noir fait partie
 * du HTML envoyé par le serveur — c'est voulu, sinon on verrait la page une
 * fraction de seconde avant que l'écran de chargement la recouvre. Mais du coup,
 * un effet React ne peut le retirer qu'APRÈS l'hydratation : le temps que le
 * JavaScript arrive, l'écran noir a déjà été peint et on récupère un flash à
 * chaque 404. Ce script, lui, s'exécute pendant l'analyse du document : il pose
 * un attribut, et une règle CSS de `globals.css` masque le panneau avant même
 * qu'il soit dessiné.
 *
 * `type !== "reload"` EST LA NUANCE UTILE. Un rechargement volontaire (F5) est
 * une façon de dire « recommence » : l'intro se rejoue. Un rechargement subi —
 * celui que Next impose sur une 404 — n'en est pas un : l'intro est sautée. Sans
 * cette distinction, on ne reverrait jamais le preloader de la session, y compris
 * en le développant.
 *
 * `try/catch` : `sessionStorage` lève une exception en navigation privée sur
 * certains navigateurs, et ce script s'exécute avant tout gestionnaire d'erreur.
 * Une exception ici laisserait le panneau noir en place pour toujours.
 */
const SKIP_INTRO_SCRIPT = `try{
var n=performance.getEntriesByType("navigation")[0];
if(sessionStorage.getItem("${INTRO_FLAG}")&&(!n||n.type!=="reload")){document.documentElement.dataset.introDone="1"}
}catch(e){}`;

/**
 * Écran de chargement, à l'arrivée sur le site.
 *
 * CE QU'IL MONTRE : le monogramme du musée sur fond noir, dont les repères de
 * cadrage s'allument et s'éteignent l'un après l'autre en tournant autour du
 * « m ». L'attente est donc figurée par la signature graphique du site
 * elle-même, et non par un sablier générique — on cadre l'œuvre avant de
 * l'accrocher, exactement ce que raconte le logo (voir `layout/Logo.tsx`).
 *
 * QUAND IL SE JOUE : une fois par session d'onglet. Jamais en navigation
 * interne — le root layout n'est pas démonté, donc le store survit. Et jamais
 * non plus sur les rechargements que Next impose de son côté, ce qui demande un
 * relais hors du JavaScript de la page : voir SKIP_INTRO_SCRIPT ci-dessus.
 *
 * RENDU CÔTÉ SERVEUR, et c'est important : le panneau noir fait partie du
 * premier HTML envoyé. S'il n'apparaissait qu'après l'hydratation, on verrait la
 * page d'accueil une fraction de seconde avant qu'un écran de chargement vienne
 * la cacher — l'exact inverse de ce qu'on cherche.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  /**
   * L'onde en cours, gardée pour pouvoir l'ARRÊTER au lieu de la laisser être
   * révoquée.
   *
   * `revertOnUpdate` de `useGSAP` annulerait le tween ET restaurerait les styles
   * d'origine : les huit repères sauteraient à pleine opacité d'une frame à
   * l'autre. Ça passait inaperçu tant que la sortie enchaînait aussitôt ; avec
   * une pause qui suit, ce saut devient la première chose qu'on regarde — et
   * avec DIM à 0, la moitié du cadre apparaît d'un coup. En gardant la main sur
   * le tween, les repères restent où l'onde les a laissés et peuvent rejoindre
   * l'opacité pleine en fondu.
   */
  const wave = useRef<gsap.core.Tween | null>(null);

  /* Seule l'ÉCRITURE du drapeau intéresse ce composant : c'est lui qui le
     baisse, il n'a pas à le lire. L'affichage du panneau suit `isPanelUp`
     ci-dessous, qui n'est plus la même chose — voir son commentaire. */
  const endIntro = useTransitionStore((state) => state.endIntro);

  /** Bascule à vrai quand l'intro a le droit de se retirer. */
  const [canLeave, setCanLeave] = useState(false);

  /**
   * Le panneau est-il encore dans le DOM ?
   *
   * DISTINCT de `isIntroRunning`, et c'est tout l'objet du correctif : les deux
   * valaient la même chose, donc rendre la main démontait le panneau au même
   * instant. Impossible, dans ces conditions, de libérer la page AVANT la fin de
   * la course du panneau — la moitié qui reste à l'écran disparaîtrait d'un
   * coup. En les séparant, `isIntroRunning` peut tomber 0,2 s plus tôt pendant
   * que le panneau, lui, finit tranquillement de s'ouvrir.
   */
  const [isPanelUp, setIsPanelUp] = useState(true);

  /**
   * RENDRE LA MAIN à la page, et se souvenir de l'avoir fait. Les deux vont
   * ensemble : toute sortie de l'intro doit laisser la trace que lira le script
   * en ligne au prochain chargement forcé.
   *
   * C'est ce signal qu'attendent `TextReveal`, `FadeIn` et `CountUp` pour se
   * lancer — il ne dit pas « le panneau est parti », il dit « la page peut
   * commencer à bouger ». Voir sa position dans la timeline.
   */
  const release = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_FLAG, "1");
    } catch {
      /* Navigation privée : tant pis, l'intro se rejouera. Pas de quoi casser
         l'affichage du site. */
    }
    endIntro();
  }, [endIntro]);

  /**
   * RETIRER LE PANNEAU, une fois sa course vraiment terminée.
   *
   * L'attribut posé sur <html> est le même que celui du script en ligne, et il
   * sert ici à une deuxième chose : il raccourcit le repli de `[data-reveal]`
   * dans globals.css. Une fois l'intro passée, plus rien ne couvre l'écran, donc
   * plus rien ne justifie de laisser un titre invisible cinq secondes en cas de
   * panne. Il est posé MAINTENANT et pas dans `release` : la règle
   * `html[data-intro-done] [data-intro] { display: none }` escamoterait sinon
   * le panneau au milieu de son ouverture.
   */
  const dismiss = useCallback(() => {
    document.documentElement.dataset.introDone = "1";
    setIsPanelUp(false);
  }, []);

  useEffect(() => {
    /* Le script en ligne a déjà tranché, et le CSS a déjà masqué le panneau :
       on se contente de le retirer du DOM. */
    if (document.documentElement.dataset.introDone) {
      release();
      dismiss();
      return;
    }

    /* Mouvements réduits : on ne joue rien du tout et on rend la main
       immédiatement. Un écran noir de plusieurs secondes sans animation n'a
       aucun sens. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      release();
      dismiss();
      return;
    }

    let cancelled = false;

    /* DEUX CONDITIONS, et la deuxième n'est pas cosmétique. `document.fonts.ready`
       attend Instrument Serif : sans elle, le « m » du logo s'afficherait dans la
       police de repli puis changerait de dessin sous les yeux du visiteur, et
       surtout les titres découpés par SplitText seraient mesurés sur la mauvaise
       police. Le preloader sert exactement à couvrir ce moment-là. */
    const minimum = new Promise((resolve) =>
      window.setTimeout(resolve, MINIMUM_DURATION),
    );

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

        /* L'ONDE QUI TOURNE. Un seul tween : `stagger` décale le départ de
           chaque repère, et `repeat`/`yoyo` placés DANS le stagger font répéter
           chaque repère individuellement plutôt que le tween entier. C'est ce
           qui produit une onde continue au lieu d'un clignotement collectif. Les
           repères étant rangés dans le sens des aiguilles d'une montre (voir
           MARK_GROUPS dans Logo.tsx), l'onde fait le tour du cadre.

           LA CONDITION D'UNE BOUCLE INVISIBLE, et c'est là que la première
           version se trompait : l'étalement total du `stagger` doit valoir
           EXACTEMENT la période d'un repère. Un repère parcourt éteint → allumé
           → éteint, donc sa période vaut deux fois sa `duration` ; l'onde, elle,
           met `each × nombre de repères` à faire le tour. Les deux calés sur
           CYCLE, le premier repère se rallume à la seconde près où l'onde lui
           revient dessus. Désaccordés — 0,84 s d'onde pour 0,9 s de période dans
           la version précédente — l'onde dérive un peu plus à chaque tour et le
           motif se désagrège au bout de quelques secondes. C'est exactement ce
           qu'on voyait. */
        gsap.set(marks, { opacity: DIM });

        wave.current = gsap.to(marks, {
          opacity: 1,
          duration: CYCLE / 2,
          ease: "sine.inOut",
          stagger: { each: CYCLE / marks.length, repeat: -1, yoyo: true },
        });

        return;
      }

      /* L'onde est ARRÊTÉE, pas révoquée : les huit repères restent exactement
         là où elle les a laissés, chacun à une opacité différente. */
      wave.current?.kill();

      gsap
        .timeline({ onComplete: dismiss })
        /* LE CADRE SE COMPLÈTE — TOUS LES REPÈRES ENSEMBLE, SANS `stagger`.
           C'est le point qui avait été mal jugé au premier essai : les faire se
           rallumer l'un après l'autre dans le sens horaire semblait prolonger
           l'onde, mais ça donnait un neuvième tour, plus lent que les huit
           précédents, dont on ne comprenait pas la fonction. L'animation doit
           S'ARRÊTER ici, pas faire un tour de plus. Un fondu simultané très
           court se lit comme une extinction du mouvement — ce qui est
           exactement ce qu'on annonce avant la pause. */
        .to(".intro-mark", {
          opacity: 1,
          duration: 0.25,
          ease: "power2.out",
          overwrite: "auto",
        })
        /* LA PAUSE. `+=HOLD` en paramètre de position : on ne crée pas un tween
           vide, on décale simplement le départ du suivant. Rien ne bouge
           pendant ce temps — c'est tout l'intérêt, et c'est le seul moment où le
           monogramme existe entier et immobile. */
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
        /* LA PAGE EST LIBÉRÉE 0,2 s AVANT LA FIN DU PANNEAU, exactement comme le
           `settle` de `PageTransition` — et pour la même raison, découverte deux
           fois.

           Posé à la toute fin (c'était un `onComplete`), le signal arrivait
           après que le panneau ait fini de s'ouvrir : on voyait d'abord la page
           entière, immobile, PUIS les titres se mettaient à monter. Deux temps
           au lieu d'un, et un enchaînement qu'on ne s'explique pas — on croit
           que la page vient de se recharger.

           `"-=0.2"` est relatif à la FIN de la timeline : le panneau a déjà
           découvert la quasi-totalité de l'écran, il ne lui reste qu'un bandeau
           en haut. Les titres commencent donc à monter pendant qu'il achève sa
           course. Pas plus tôt : ils se révéleraient derrière lui et on en
           perdrait le début. */
        .call(release, undefined, "-=0.2");
    },
    /* PAS de `revertOnUpdate` ici, contrairement au réflexe : il annulerait
       l'onde en RESTAURANT l'opacité d'origine des repères, donc d'un coup. On
       veut partir de l'état où l'onde les a laissés pour les éteindre en fondu
       — d'où le `kill()` explicite plus haut. */
    { scope: root, dependencies: [canLeave] },
  );

  return (
    <>
      {/* CE PANNEAU EST LE SEUL ÉLÉMENT DU SITE QUI PEUT LE RENDRE INUTILISABLE.
          Il recouvre l'écran dès le premier HTML et c'est JavaScript, et lui
          seul, qui le retire. Si le script ne s'exécute jamais, le visiteur reste
          devant un rectangle noir. Deux filets, pour deux pannes différentes :

          1. JAVASCRIPT DÉSACTIVÉ OU BLOQUÉ — le navigateur n'applique le contenu
             d'un <noscript> que dans ce cas précis. Le panneau n'apparaît alors
             même pas : pas d'attente, le site est directement lisible.
          2. JAVASCRIPT PRÉSENT MAIS EN ÉCHEC (erreur d'hydratation, script coupé
             en route) — le <noscript> ne sert à rien puisque le JS est bien là.
             C'est le repli CSS minuté de globals.css qui prend le relais. */}
      <noscript>
        {/* Le second sélecteur accompagne le premier : sans intro à couvrir, le
            repli de `[data-reveal]` n'a plus aucune raison d'attendre les 5 s
            calées sur elle (voir globals.css). GSAP ne prendra jamais la main
            ici — autant afficher les titres tout de suite. */}
        <style>
          {"[data-intro]{display:none}[data-reveal]{animation-delay:0s}"}
        </style>
      </noscript>

      {/* Voir SKIP_INTRO_SCRIPT : ce script doit s'exécuter AVANT le premier
          affichage, donc plus tôt que React — d'où l'injection directe, seule
          façon d'y arriver. Le contenu est une constante du module, aucune
          donnée extérieure n'y entre : rien à échapper, rien à injecter. */}
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: constante du module, voir juste au-dessus.
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
