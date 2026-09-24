"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Efface la mémoire de scroll de ScrollTrigger à chaque changement de page.
 *
 * Le bug corrigé est invisible dans le code : en cliquant « À propos » depuis
 * l'accueil, on n'arrivait pas en haut de la page mais à la hauteur où on avait
 * quitté la précédente.
 *
 * 1. ScrollTrigger enregistre la position pour pouvoir la restaurer après un
 *    `refresh()` — c'est ce qui évite qu'un redimensionnement fasse sauter la
 *    page.
 * 2. Le routeur remet le scroll à 0.
 * 3. La nouvelle page monte, son `TextReveal` crée un ScrollTrigger, ce qui
 *    déclenche un `refresh()`.
 * 4. Ce refresh restaure la position enregistrée… celle de la page précédente.
 *
 * Cette mémoire a un sens dans un site classique, où recharger revient au même
 * document. En navigation client, deux pages n'ont ni la même hauteur ni le même
 * contenu. `clearScrollMemory()` est prévu pour ce cas.
 *
 * `useLayoutEffect` : la mémoire doit être vidée avant que le navigateur peigne.
 *
 * Monté au-dessus de `{children}` dans le root layout : les effets partent des
 * enfants vers les parents, celui-ci s'exécute donc avant le `TextReveal` de la
 * page qui arrive, c'est-à-dire avant le refresh fautif.
 */
export function ScrollMemoryReset() {
  const pathname = usePathname();

  /* biome-ignore lint/correctness/useExhaustiveDependencies: `pathname` n'est pas
     une donnée lue par l'effet, c'est son déclencheur. Le retirer exécuterait
     l'effet une seule fois au montage du layout. */
  useLayoutEffect(() => {
    ScrollTrigger.clearScrollMemory();

    /* La page qui arrive n'a ni la même hauteur ni les mêmes déclencheurs. La
       mémoire venant d'être vidée, ce refresh ne peut plus rien restaurer. */
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
}
