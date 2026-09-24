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
 * `clip-path` et non une transformation : un `translateY` déplacerait le panneau
 * avec son contenu, le nom de la salle glisserait depuis le bas. Le clip ne
 * déplace rien, il découvre — le mur monte, le texte reste posé au milieu.
 *
 * Toujours vers le haut : le panneau entre par le bas, recouvre, puis sort par
 * le haut. Une transition qui repart d'où elle vient donne l'impression qu'il ne
 * s'est rien passé.
 */
const HIDDEN = "inset(100% 0% 0% 0%)";
const COVERING = "inset(0% 0% 0% 0%)";
const GONE = "inset(0% 0% 100% 0%)";

/**
 * Le panneau reste fermé tant que l'URL n'est pas la bonne, ce qui permet
 * d'attendre une page lente sans écran blanc — mais enfermerait le visiteur si
 * la navigation n'aboutissait jamais. Mieux vaut une transition inutile qu'un
 * site bloqué.
 */
const NAVIGATION_TIMEOUT = 6000;

/**
 * Panneau de transition entre deux pages : l'étape « y aller » de
 * `TransitionLink`, jouée à la fin de l'animation.
 *
 * Monté dans le root layout et non dans un `template.tsx`, contrairement à ce
 * qu'on lit partout. En Next 16, chaque template reçoit une clé au niveau de son
 * propre segment : un `app/template.tsx` porte la même clé pour `/collection` et
 * `/collection/starry-night`, il ne remonte donc pas entre la grille et la
 * fiche — le parcours principal du site.
 *
 * Le déclencheur est le `pathname`, qui change à toutes les profondeurs. Même
 * schéma que `ScrollMemoryReset`.
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
   * Rien ne dit quand la page suivante est réellement affichée : le seul signal
   * fiable est le changement de `pathname`.
   *
   * La boucle infinie est évitée par la condition `phase === "leaving"`, vraie
   * une seule fois, et par la machine à états du store qui interdit tout retour
   * en arrière.
   */
  useEffect(() => {
    if (phase !== "leaving" || !destination) return;

    /* Comparaison sur le chemin, l'ancre retirée : `usePathname` ne la renvoie
       jamais, et sans ce découpage l'arrivée ne serait jamais détectée sur
       `/billetterie#panier`. */
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
          /* Le panneau doit avaler les clics : sinon on peut cliquer un lien à
             travers le mur noir et lancer une seconde navigation. */
          .set(panel, { pointerEvents: "auto", clipPath: HIDDEN, opacity: 0 })
          .set(text, { yPercent: 40, opacity: 0 })
          /* `ease: "none"` sur l'opacité : une courbe `out` atteindrait l'opaque
             dans son premier tiers, le fondu serait fini bien avant le mur. Il se
             termine à 0,7 s, donc avant le `router.push` de 0,95 s — le panneau
             doit être opaque au moment où la page change dessous. */
          .to(panel, { opacity: 1, duration: 0.7, ease: "none" }, 0)
          /* `power2.inOut` ici, ordre 4 au retrait : les deux moitiés n'ont pas
             le même travail. Ce moment est du temps mort, autant en faire une
             disparition posée — en ordre 4 le mur claquait, et une page qu'on
             quitte brutalement se lit comme une page qui se ferme au nez. */
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
          /* L'écran est couvert : tout le mécanisme n'existe que pour retarder
             cette ligne. */
          .call(() => router.push(destination ?? "/"), undefined, 0.95);

        return;
      }

      if (phase === "entering") {
        /* Positions absolues et non relatives : le `settle` doit tomber avant la
           fin du panneau, et un `"-=0.3"` décalerait aussi tout ce qui suit.

           `power4.inOut` à l'inverse de la fermeture, et c'est le parti pris de
           cette transition : le visiteur attend depuis presque une seconde, la
           page est prête, le mur n'a plus rien à raconter — il doit dégager.
           0,95 s pour couvrir, 0,7 s pour libérer. */
        gsap
          .timeline()
          /* `overwrite: "auto"` : sur une page instantanée, le texte peut être
             encore en train d'apparaître quand on le fait sortir. */
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
          /* Fondu décalé de 0,3 s sur le balayage : lancés ensemble, le noir
             devenait translucide alors qu'il couvrait encore l'écran et on voyait
             la page entière en gris. */
          .to(panel, { opacity: 0, duration: 0.35, ease: "power2.in" }, 0.35)
          /* Retour à "idle" anticipé de 0,2 s : c'est lui qui autorise les
             `TextReveal` de la page qui arrive. Posé à la fin, on voyait une page
             finie PUIS une animation. Pas plus tôt, sinon le titre se révèle
             derrière le panneau. */
          .call(settle, undefined, 0.5)
          /* `opacity` remise à 1 : c'est le clip, pas l'opacité, qui garde le
             panneau invisible au repos. L'oublier rendrait la transition suivante
             transparente. */
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
    /* L'état initial est posé en `style` et non par une classe : il doit être
       exact dès le premier octet de HTML, sinon le panneau apparaît en plein
       écran le temps que le JS démarre. */
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
