"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { useTransitionStore } from "@/lib/store";

gsap.registerPlugin(useGSAP);

/**
 * Les trois états du curseur : un diamètre et un remplissage, rien d'autre.
 *
 * `size` est en REM comme tout le reste du site — en px, le curseur serait le
 * seul élément de la page à ne pas suivre le rem fluide et rapetisserait à
 * mesure que l'écran s'agrandit (voir le bloc « typographie fluide » de
 * globals.css).
 *
 * `fill` est l'opacité du disque intérieur, et c'est lui qui porte tout l'effet.
 * Le cercle a TOUJOURS sa bordure ; au repos le disque la recouvre et on ne voit
 * qu'un point plein, au survol le disque s'efface et il ne reste que le trait.
 * Le point ne grossit donc pas, il S'OUVRE — nuance qui compte : un disque noir
 * de 24 px masquerait précisément ce qu'on est en train de pointer.
 *
 * Le clic, lui, n'est PAS un troisième état : voir PRESS_SCALE.
 */
const STATES = {
  idle: { size: 0.375, fill: 1 },
  hot: { size: 1.5, fill: 0 },
} as const;

type CursorState = keyof typeof STATES;

/**
 * Le clic CONTRACTE le cercle, quel que soit son état — il ne lui en impose pas
 * un troisième.
 *
 * La version précédente donnait au clic son propre diamètre absolu, et c'était
 * un contresens visible : un clic dans le vide faisait passer le point de 6 à
 * 18 px, donc GROSSIR, là où un appui doit s'enfoncer. Un facteur applique la
 * même intention aux deux états — le point se resserre, l'anneau se referme — et
 * supprime au passage la troisième valeur à tenir cohérente avec les deux
 * autres.
 */
const PRESS_SCALE = 0.72;

/**
 * Ce qui fait réagir le curseur.
 *
 * Un sélecteur CSS plutôt qu'un attribut à poser composant par composant : les
 * liens et les boutons du site sont déjà des liens et des boutons, les marquer
 * un par un créerait une seconde source de vérité qu'on oublierait de tenir à
 * jour dès la page suivante.
 */
const TARGETS =
  'a, button, [role="button"], label, summary, select, input, textarea';

/**
 * Champs de saisie : le curseur s'efface et le caret du système reprend la main
 * (l'autre moitié de la règle est dans globals.css, à côté du `cursor: none`).
 *
 * Les cases à cocher et les boutons radio en sont exclus : ce sont des `input`,
 * mais on ne tape rien dedans — ils doivent se comporter comme des boutons. La
 * billetterie en est remplie, l'oubli s'y serait vu tout de suite.
 */
const TEXT_FIELDS =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]), textarea, [contenteditable="true"]';

/**
 * Zones qui dessinent DÉJÀ leur propre curseur : le point s'y efface.
 *
 * Un seul cas aujourd'hui, `ui/GlassLens` — la loupe est elle-même un disque qui
 * suit la souris, et le point venait se poser au centre de la lentille, c'est-à-
 * dire précisément sur le détail qu'on est en train d'agrandir.
 *
 * À NE PAS CONFONDRE AVEC `cursor: none`, qui reste actif dans ces zones : il ne
 * s'agit pas de rendre la main au système — la flèche par-dessus la loupe serait
 * exactement le même défaut — mais de retirer le nôtre au profit d'un autre.
 * C'est le même mécanisme que pour les champs de saisie, à une différence près :
 * là, le caret revient (voir globals.css) ; ici, rien ne revient.
 */
const HIDDEN_ZONES = "[data-cursor-hidden]";

/**
 * Le curseur du site : un point noir.
 *
 * Un disque plein de 6 px, qui s'ouvre en anneau de 24 px sur tout ce qui est
 * cliquable. C'est tout. Le parti pris est la discrétion — sur un site dont la
 * règle est de laisser l'œuvre porter le design, un curseur qui se fait
 * remarquer est un curseur de trop.
 *
 * AUCUN RETARD SUR LA POSITION, et c'est le choix central du composant. Le
 * curseur qui traîne derrière la souris est l'effet le plus répandu du genre ;
 * il est aussi celui qui coûte le plus cher, parce que remplacer le curseur du
 * système revient à retirer le seul repère de précision dont dispose
 * l'utilisateur. Un site de musée demande de viser des vignettes, des cases à
 * cocher, des pas de quantité : la traîne s'y paie à chaque clic. Seuls les
 * CHANGEMENTS D'ÉTAT sont animés — le point s'ouvre et se referme en 0,35 s,
 * mais il est toujours exactement sous la souris.
 *
 * LE FILET DE SÉCURITÉ EST DANS LE SENS DE LA LOGIQUE, et c'est délibéré.
 * `cursor: none` n'est PAS écrit en dur dans globals.css : il est conditionné à
 * l'attribut `data-cursor-on`, que ce composant pose LUI-MÊME, et seulement une
 * fois qu'il s'est assuré de pouvoir dessiner un remplaçant. JavaScript
 * désactivé, script en erreur, écran tactile, `prefers-reduced-motion` : dans
 * tous ces cas l'attribut n'arrive jamais et le curseur du système n'a jamais
 * disparu. Aucune panne ne peut produire un site sans curseur, c'est-à-dire un
 * site inutilisable. Le preloader protège son panneau noir par le même
 * raisonnement, pour la même raison.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);

  /**
   * Les deux panneaux noirs plein écran — l'intro et la transition de page.
   *
   * Ils recouvrent tout, y compris le `[data-tone="ink"]` du Header sur lequel
   * s'appuie la détection de fond. Or cette détection est branchée sur
   * `pointerover`, qui ne se déclenche QUE lorsque la souris change d'élément :
   * un panneau qui apparaît — ou se retire — sous un curseur immobile ne
   * déclenche rien. On lit donc l'état du store, au lieu de l'attendre du DOM.
   *
   * LE CAS QUI IMPOSE `refreshTone` EST LE RETRAIT, pas l'arrivée, et il est
   * facile à manquer : on clique un lien DANS le Header, le panneau recouvre
   * tout, la page change, le panneau se retire — et la souris n'a pas bougé d'un
   * pixel depuis le clic. Sans recalcul, le curseur repasserait en noir alors
   * qu'il est toujours posé sur le Header noir, et disparaîtrait jusqu'au
   * prochain mouvement. C'est le trajet le plus courant du site.
   */
  const isIntroRunning = useTransitionStore((state) => state.isIntroRunning);
  const isCovered = useTransitionStore((state) => state.phase !== "idle");
  const isOverPanel = isIntroRunning || isCovered;

  /**
   * Passerelle entre React et l'effet GSAP, dans les deux sens : le ref porte
   * l'état courant (lu par les gestionnaires d'événements, qui ne sont créés
   * qu'une fois et ne verraient jamais une nouvelle valeur de `isOverPanel`), et
   * `refreshTone` expose à React le recalcul qui vit dans l'effet.
   *
   * Pourquoi pas simplement `dependencies: [isOverPanel]` sur le `useGSAP` :
   * l'effet entier serait rejoué à chaque transition de page, donc
   * `data-cursor-on` retiré puis reposé et tous les écouteurs débranchés puis
   * rebranchés — un remplacement de curseur qui clignote à chaque navigation,
   * pour mettre à jour un booléen.
   */
  const overPanelRef = useRef(false);
  const refreshTone = useRef<(() => void) | null>(null);

  useEffect(() => {
    overPanelRef.current = isOverPanel;
    refreshTone.current?.();
  }, [isOverPanel]);

  useGSAP(
    () => {
      const layer = root.current;
      const ringEl = ring.current;
      const fillEl = fill.current;
      if (!layer || !ringEl || !fillEl) return;

      /* `matchMedia` et non une règle CSS : il ne s'agit pas d'atténuer une
         animation mais de ne pas remplacer le curseur du tout.

         `pointer: fine` exclut le tactile — masquer un curseur qui n'existe pas
         n'a aucun sens. `prefers-reduced-motion` exclut les visiteurs qui ont
         désactivé les animations dans leur système : leur remplacer leur curseur
         par le nôtre est exactement le genre de chose qu'ils ont refusé. */
      const mm = gsap.matchMedia();

      mm.add(
        "(pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          /* LE CURSEUR DU SYSTÈME NE DISPARAÎT QU'ICI — c'est-à-dire seulement
             une fois qu'on sait qu'un remplaçant va être dessiné. Tout le filet
             de sécurité décrit en en-tête tient dans cette ligne. */
          document.documentElement.dataset.cursorOn = "";

          /* Le centrage est posé par GSAP et non en CSS : GSAP réécrit la
             propriété `transform` entière quand il anime `x`/`y`, un
             `-translate-x-1/2` déclaré en classe serait donc écrasé au premier
             mouvement. Une seule autorité sur le transform.

             En POURCENTAGE, et c'est ce qui rend l'ouverture gratuite : le
             navigateur résout ces -50 % contre la taille courante de l'élément,
             donc le cercle reste centré sur la souris pendant qu'il passe de
             6 px à 24 px, sans une ligne de code pour le recentrer. */
          gsap.set(ringEl, { xPercent: -50, yPercent: -50 });

          /* `quickSetter` et non `gsap.set` : c'est la version sans tween ni
             analyse des arguments, faite pour être appelée à chaque frame. C'est
             aussi la traduction en code du parti pris du composant — la position
             n'est pas animée, elle est ÉCRITE. */
          const setX = gsap.quickSetter(ringEl, "x", "px") as (
            value: number,
          ) => void;
          const setY = gsap.quickSetter(ringEl, "y", "px") as (
            value: number,
          ) => void;

          /* TROIS BOOLÉENS ET UN ÉTAT, tenus en variables locales et non dans un
             `useState`. Ils changent à chaque survol et à chaque clic : passer
             par React ferait re-rendre le composant des dizaines de fois par
             seconde sans jamais changer une ligne de JSX. */
          let visible = false; // la souris est entrée et a bougé au moins une fois
          let suppressed = false; // on survole un champ de saisie : curseur effacé
          let pressed = false; // bouton enfoncé
          let state: CursorState = "idle";

          /** Position connue, pour `refreshTone` : -1 tant que rien n'a bougé. */
          let lastX = -1;
          let lastY = -1;

          /** La couche ne s'affiche que si les deux conditions tiennent. */
          const sync = () => {
            gsap.to(layer, {
              autoAlpha: visible && !suppressed ? 1 : 0,
              duration: 0.2,
              overwrite: "auto",
            });
          };

          /**
           * Fond sombre : un curseur noir y serait invisible.
           *
           * On réutilise le `data-tone="ink"` que portent déjà le Header, le
           * Footer et les Section inversées — l'attribut existe pour le contour
           * de focus et répond exactement à la même question, « ce fond est-il
           * sombre ? ». Une deuxième convention pour la même information finirait
           * par en contredire une.
           *
           * Les panneaux plein écran passent AVANT le DOM : ils recouvrent tout,
           * donc l'élément survolé ne dit plus rien du fond réellement visible.
           */
          const setTone = (element: Element | null) => {
            layer.dataset.tone =
              overPanelRef.current || element?.closest('[data-tone="ink"]')
                ? "ink"
                : "paper";
          };

          /* Recalcul à la demande, appelé par React quand un panneau arrive ou
             se retire. `elementFromPoint` ignore le curseur lui-même, qui est en
             `pointer-events: none` — il rend bien l'élément de la page. */
          refreshTone.current = () => {
            setTone(lastX < 0 ? null : document.elementFromPoint(lastX, lastY));
          };

          /** Le diamètre et le remplissage de l'état courant, contractés si on appuie. */
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
             CHANGEMENT d'élément survolé. Relancer un `closest()` à chaque pixel
             parcouru serait du travail jeté soixante fois par seconde. */
          const onOver = (event: PointerEvent) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            setTone(target);

            const hit = target.closest<HTMLElement>(TARGETS);

            /* Deux raisons de s'effacer, et c'est au fond la même : un autre
               curseur est déjà dessiné à cet endroit — le caret du système dans
               un champ, la lentille sur la loupe. Le test des zones porte sur
               l'élément survolé et non sur `hit`, qui ne remonte qu'aux éléments
               interactifs : la loupe n'en est pas un. */
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

          /* Souris sortie de la fenêtre : sans ça le point resterait figé sur le
             bord, à côté du curseur système redevenu visible dans la barre
             d'onglets. */
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
            /* Rendre le curseur du système AVANT tout le reste : si ce nettoyage
               s'interrompait en chemin, mieux vaut un point orphelin qu'un site
               sans aucun curseur. */
            delete document.documentElement.dataset.cursorOn;
            refreshTone.current = null;
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
    /* `pointer-events-none` sur toute la couche, sinon le curseur se survole
       LUI-MÊME : il serait en permanence sa propre cible et aucun lien ne serait
       jamais détecté.

       z-200 : au-dessus de tout, y compris du preloader (z-110) et du panneau de
       transition (z-100). Un curseur qui passe derrière un panneau disparaît.

       `aria-hidden` : un lecteur d'écran n'a rien à annoncer d'un curseur.

       `visibility: hidden` en style EN LIGNE et non par une classe : la couche
       doit être invisible dès le premier octet de HTML. Le point n'apparaît
       qu'au premier mouvement de souris, sinon il se dessinerait dans le coin
       haut-gauche — à la position 0,0 — en attendant qu'on bouge.

       `data-tone` n'est ici qu'une VALEUR DE DÉPART, jamais pilotée par React :
       `setTone` en est la seule autorité. Le faire dépendre d'un état React
       aurait produit un écrasement silencieux — à chaque rendu, React aurait
       rétabli sa propre valeur par-dessus celle du survol, et le point serait
       redevenu noir sur le Header noir. Une seule source par attribut. */
    <div
      ref={root}
      aria-hidden="true"
      data-tone="paper"
      style={{ visibility: "hidden" }}
      className="pointer-events-none fixed inset-0 z-200 text-ink data-[tone=ink]:text-paper"
    >
      {/* LE CERCLE PORTE TOUJOURS SA BORDURE, à tous les états. Au repos, le
          disque intérieur opaque la recouvre exactement et on ne voit qu'un
          point plein ; la faire apparaître au survol aurait demandé d'animer une
          épaisseur, donc de la voir grossir. Ici elle est simplement découverte.

          Aucune taille en CSS : le diamètre est piloté par GSAP (voir STATES),
          une valeur de départ en classe se ferait écraser au premier survol et
          ne servirait qu'à mentir sur l'état réel. */}
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
