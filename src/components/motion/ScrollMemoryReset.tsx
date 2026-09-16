"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Efface la mémoire de scroll de ScrollTrigger à chaque changement de page.
 *
 * LE BUG QU'IL CORRIGE, parce qu'il est invisible dans le code et coûte une
 * demi-journée à retrouver : en cliquant « À propos » depuis l'accueil, on
 * n'arrivait pas en haut de la page mais à la hauteur où on avait quitté la
 * précédente.
 *
 * L'enchaînement, dans l'ordre :
 * 1. ScrollTrigger enregistre en permanence la position de défilement, pour
 *    pouvoir la restaurer après un `refresh()` — c'est ce qui évite qu'un
 *    redimensionnement de fenêtre fasse sauter la page.
 * 2. Le routeur de Next remet le scroll à 0. Jusqu'ici tout va bien.
 * 3. La nouvelle page monte, son `TextReveal` crée un ScrollTrigger, ce qui
 *    déclenche un `refresh()`.
 * 4. Ce refresh RESTAURE la position enregistrée… qui est celle de la page
 *    précédente. Le travail du routeur est défait.
 *
 * Cette mémoire a un sens dans un site classique, où recharger une page revient
 * au même document. Dans une application à navigation client, elle n'en a
 * aucun : deux pages n'ont ni la même hauteur ni le même contenu.
 * `clearScrollMemory()` est prévu exactement pour ce cas par GSAP.
 *
 * `useLayoutEffect` et non `useEffect` : la mémoire doit être vidée AVANT que
 * le navigateur peigne, sinon on verrait la page sauter.
 *
 * Monté dans le root layout, au-dessus de `{children}` : les effets de React
 * partent des enfants vers les parents dans l'ordre de l'arbre, donc celui-ci
 * s'exécute avant le `TextReveal` de la page qui arrive — c'est-à-dire avant que
 * le refresh fautif ait lieu.
 *
 * Ne rend rien : il n'existe que pour son effet de bord.
 */
export function ScrollMemoryReset() {
  const pathname = usePathname();

  /* biome-ignore lint/correctness/useExhaustiveDependencies: `pathname` n'est pas
     une donnée LUE par l'effet, c'est son DÉCLENCHEUR — il n'existe que pour
     relancer le nettoyage à chaque changement de page. Le retirer, comme le
     propose la règle, exécuterait l'effet une seule fois au montage du layout et
     supprimerait purement et simplement le composant. */
  useLayoutEffect(() => {
    ScrollTrigger.clearScrollMemory();

    /* La page qui arrive n'a ni la même hauteur ni les mêmes déclencheurs :
       sans ce recalcul, les ScrollTrigger encore vivants garderaient les
       mesures de la page précédente. La mémoire venant d'être vidée, ce
       refresh ne peut plus restaurer quoi que ce soit. */
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
}
