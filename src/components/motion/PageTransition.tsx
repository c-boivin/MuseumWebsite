"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useTransitionStore } from "@/lib/store";

gsap.registerPlugin(useGSAP);

/**
 * Les trois positions du panneau, en `clip-path`.
 *
 * POURQUOI `clip-path` ET NON UNE TRANSFORMATION. Un `translateY` déplacerait le
 * panneau AVEC son contenu : le nom de la salle glisserait depuis le bas de
 * l'écran, ce qui donne un carton qu'on pousse. Le `clip-path` ne déplace rien,
 * il ne fait que découvrir ou masquer : le mur monte, le texte reste posé au
 * milieu. C'est la différence entre un volet qui coulisse et une cimaise qu'on
 * franchit.
 *
 * Les trois valeurs décrivent un seul et même mouvement, toujours vers le HAUT :
 * le panneau entre par le bas, recouvre, puis continue sa course et sort par le
 * haut. Il ne revient jamais sur ses pas — une transition qui repart d'où elle
 * vient donne l'impression qu'il ne s'est rien passé.
 */
const HIDDEN = "inset(100% 0% 0% 0%)";
const COVERING = "inset(0% 0% 0% 0%)";
const GONE = "inset(0% 0% 100% 0%)";

/**
 * Délai de sécurité, en millisecondes, avant de rouvrir le panneau de force.
 *
 * Le panneau reste fermé tant que l'URL n'est pas devenue celle qu'on a
 * demandée. C'est ce qui permet d'attendre une page lente sans écran blanc —
 * mais c'est aussi ce qui enfermerait le visiteur derrière un mur noir si la
 * navigation n'aboutissait jamais (réseau coupé au mauvais moment). Au bout de
 * ce délai, on rouvre : mieux vaut une transition qui n'a servi à rien qu'un
 * site inutilisable.
 */
const NAVIGATION_TIMEOUT = 6000;

/**
 * Panneau de transition entre deux pages — l'étape 3 du mécanisme décrit dans
 * `TransitionLink` : « y aller », mais à la fin de l'animation.
 *
 * MONTÉ DANS LE ROOT LAYOUT, PAS DANS UN `template.tsx`, et c'est un vrai écart
 * avec ce qu'on lit partout. `template.tsx` est présenté comme LA solution parce
 * qu'il est remonté à chaque navigation. C'est faux en Next 16 : la
 * documentation (`node_modules/next/dist/docs/01-app/03-api-reference/
 * 03-file-conventions/template.md`) précise que chaque template reçoit une clé
 * AU NIVEAU DE SON PROPRE SEGMENT. Un `app/template.tsx` a donc la même clé
 * `/collection` pour `/collection` et pour `/collection/starry-night` : il ne
 * remonte pas entre la grille et la fiche, c'est-à-dire précisément sur le
 * parcours principal du site. On aurait eu une transition qui marche partout
 * sauf là où elle compte.
 *
 * Le déclencheur est donc le `pathname`, lu au même endroit et de la même façon
 * que dans `ScrollMemoryReset` : un seul composant, monté une fois, qui
 * fonctionne quelle que soit la profondeur du segment.
 */
export function PageTransition() {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLParagraphElement>(null);

  const router = useRouter();
  const pathname = usePathname();

  const phase = useTransitionStore((state) => state.phase);
  const destination = useTransitionStore((state) => state.destination);
  const roomName = useTransitionStore((state) => state.label);
  const arrive = useTransitionStore((state) => state.arrive);
  const settle = useTransitionStore((state) => state.settle);

  /**
   * DÉTECTION DE L'ARRIVÉE. Le `router.push` est lancé à la fin de l'animation
   * de sortie ; rien ne dit quand la page suivante est réellement affichée. Le
   * seul signal fiable est le changement de `pathname` : il ne bascule que
   * lorsque la nouvelle route est rendue.
   *
   * LA BOUCLE INFINIE À ÉVITER se joue ici. Si cet effet rejouait l'animation à
   * chaque rendu, chaque passage en "entering" provoquerait un rendu, qui
   * relancerait l'effet, sans fin. Deux garde-fous : la condition `phase ===
   * "leaving"` n'est vraie qu'UNE fois (on passe ensuite en "entering", et
   * l'appel devient impossible), et la machine à états du store ne permet aucun
   * retour en arrière.
   */
  useEffect(() => {
    if (phase !== "leaving" || !destination) return;

    /* Comparaison sur le CHEMIN, l'ancre retirée : une destination peut en
       porter une (`/billetterie#panier`), que `usePathname` ne renvoie jamais.
       Sans ce découpage, l'arrivée ne serait jamais détectée sur ces liens-là et
       le panneau resterait à l'écran jusqu'au filet de sécurité. */
    if (pathname !== destination.split("#")[0]) return;

    arrive();
  }, [pathname, phase, destination, arrive]);

  /** Filet de sécurité : voir NAVIGATION_TIMEOUT. */
  useEffect(() => {
    if (phase !== "leaving") return;

    const timer = window.setTimeout(arrive, NAVIGATION_TIMEOUT);
    return () => window.clearTimeout(timer);
  }, [phase, arrive]);

  useGSAP(
    () => {
      const panel = root.current;
      const text = label.current;
      if (!panel || !text) return;

      if (phase === "leaving") {
        gsap
          .timeline()
          /* `pointerEvents` en ligne plutôt qu'une classe : pendant que le
             panneau recouvre l'écran, il doit AVALER les clics. Sans ça, on
             peut cliquer un lien à travers le mur noir et lancer une seconde
             navigation par-dessus la première. */
          .set(panel, { pointerEvents: "auto", clipPath: HIDDEN, opacity: 0 })
          .set(text, { yPercent: 40, opacity: 0 })
          /* LE FONDU, EN LINÉAIRE ET SUR PRESQUE TOUTE LA MONTÉE. `ease: "none"`
             n'est pas une paresse : sur une opacité, une courbe `out` atteint
             l'opaque dans son premier tiers, le fondu est donc fini bien avant
             que le mur ait fini de monter et ne sert plus à rien. En linéaire,
             l'assombrissement accompagne vraiment le balayage de bout en bout.

             Il se termine à 0,7 s, donc AVANT le `router.push` de 0,95 s : le
             panneau doit être parfaitement opaque au moment où la page change
             dessous, sinon on aperçoit la substitution au travers. */
          .to(panel, { opacity: 1, duration: 0.7, ease: "none" }, 0)
          /* `power2.inOut` ICI — le retrait, lui, est en ordre 4 (voir plus
             bas). Ce n'est pas une incohérence : les deux moitiés n'ont pas le
             même travail.

             CE MOMENT-CI EST DU TEMPS MORT. L'utilisateur vient de cliquer, la
             page suivante n'est pas encore là, et il n'y a rien à regarder :
             autant en faire une disparition posée. Une courbe d'ordre 4 passe
             près de 80 % de la distance dans le tiers central de sa durée — le
             mur claquait, et une page qu'on quitte brutalement se lit comme une
             page qui se ferme au nez. En ordre 2 la course se répartit, et le
             fondu linéaire par-dessus donne un assombrissement au lieu d'une
             occultation. */
          .to(
            panel,
            { clipPath: COVERING, duration: 0.95, ease: "power2.inOut" },
            0,
          )
          .to(
            text,
            { yPercent: 0, opacity: 1, duration: 0.55, ease: "power3.out" },
            0.45,
          )
          /* L'écran est couvert : c'est seulement MAINTENANT qu'on navigue. Tout
             le mécanisme n'existe que pour retarder cette ligne. */
          .call(() => router.push(destination ?? "/"), undefined, 0.95);

        return;
      }

      if (phase === "entering") {
        /* POSITIONS ABSOLUES (0, 0.15, 0.35, 0.5, 0.7) et non relatives, parce
           que l'ordre d'écriture ne suffit plus à décrire cette timeline : le
           `settle` doit tomber AVANT la fin du panneau, et un `"-=0.3"` placé là
           décalerait aussi tout ce qui suit. Écrites en absolu, les étapes se
           lisent comme une partition.

           `power4.inOut` ICI, à l'inverse de la fermeture qui est en ordre 2, et
           l'asymétrie est le vrai parti pris de cette transition.

           CE MOMENT-CI EST LA RÉCOMPENSE. Le visiteur attend depuis presque une
           seconde derrière un écran noir ; la page qu'il a demandée est prête et
           se trouve juste derrière. Le mur n'a plus rien à raconter : ce qu'on
           attend de lui, c'est qu'il DÉGAGE. Une sortie étalée, c'est du délai
           ajouté à une page déjà chargée — l'animation devient ce qui sépare de
           la page au lieu de ce qui y mène.

           D'où le déséquilibre assumé des deux moitiés : 0,95 s pour couvrir,
           0,7 s pour libérer. Le retrait démarre aussi plus tôt (0,15 s au lieu
           de 0,25 s) — ce décalage servait à laisser le nom de la salle se lire,
           mais il a déjà été lu pendant la fermeture, le répéter à la sortie ne
           fait qu'ajouter de l'attente. */
        gsap
          .timeline()
          /* `overwrite: "auto"` : sur une page qui répond instantanément, le
             texte peut être encore en train d'apparaître quand on décide de le
             faire sortir. Sans ça, les deux tweens se disputeraient l'opacité. */
          .to(
            text,
            {
              yPercent: -40,
              opacity: 0,
              duration: 0.3,
              ease: "power3.in",
              overwrite: "auto",
            },
            0,
          )
          .to(
            panel,
            { clipPath: GONE, duration: 0.55, ease: "power4.inOut" },
            0.15,
          )
          /* LE FONDU DE SORTIE, décalé de 0,3 s sur le balayage et non lancé en
             même temps. Démarré ensemble, le noir devenait translucide alors
             qu'il couvrait encore presque tout l'écran : on voyait la page
             entière en gris, et l'effet de mur qui se retire disparaissait. En
             le retardant, le panneau reste franc pendant qu'il découvre le bas
             de la page, puis se dissout sur la fin. */
          .to(panel, { opacity: 0, duration: 0.35, ease: "power2.in" }, 0.35)
          /* LE RETOUR À "idle" EST DÉLIBÉRÉMENT ANTICIPÉ DE 0,2 s.
             C'est ce signal qui autorise les `TextReveal` de la page qui arrive
             à se lancer (voir ce composant). Posé à la toute fin, le titre
             attendait que le panneau ait complètement disparu avant de bouger :
             on voyait une page finie, PUIS une animation — deux temps au lieu
             d'un. Anticipé, le titre monte pendant que le mur achève sa course,
             et les deux mouvements n'en font qu'un.

             Pourquoi pas plus tôt : au-delà, le titre commence à se révéler
             alors que le panneau le couvre encore, et on en perd le début. */
          .call(settle, undefined, 0.5)
          /* Remise en position de départ, sous l'écran, prête pour la prochaine
             navigation — et plus de capture des clics. `opacity` remise à 1 :
             c'est le clip, et non l'opacité, qui garde le panneau invisible au
             repos. L'oublier rendrait la transition suivante transparente. */
          .set(
            panel,
            { pointerEvents: "none", clipPath: HIDDEN, opacity: 1 },
            0.7,
          );
      }
    },
    { scope: root, dependencies: [phase] },
  );

  return (
    /* `aria-hidden` : le panneau est un effet visuel, pas du contenu. Un lecteur
       d'écran ne doit ni l'annoncer ni s'y arrêter — il a déjà appris la
       destination en lisant le lien cliqué.

       L'état initial (hors écran) est posé en `style` et non par une classe :
       il doit être exact dès le premier octet de HTML, avant toute hydratation,
       sinon le panneau apparaît en plein écran le temps que le JS démarre. */
    <div
      ref={root}
      aria-hidden="true"
      style={{ clipPath: HIDDEN }}
      className="pointer-events-none fixed inset-0 z-100 flex items-center justify-center bg-ink-deep"
    >
      <p ref={label} className="font-display text-display text-paper">
        {roomName}
      </p>
    </div>
  );
}
