"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type LenisRef, ReactLenis, useLenis } from "lenis/react";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Défilement amorti sur tout le site (Lenis).
 *
 * CE QU'IL REMPLACE, ET CE QU'IL A COÛTÉ. Le site reposait jusqu'ici sur
 * `scroll-snap-type: y proximity` : les blocs plein écran aimantaient le scroll
 * et lui donnaient des points de repos. Lenis ne sait pas faire les deux — le
 * README de la librairie l'écrit noir sur blanc (« no support for CSS
 * scroll-snap »), et le piège est qu'il ne PRÉVIENT de rien : les règles CSS
 * restent valides, elles n'ont simplement plus aucun effet puisque le scroll
 * n'est plus piloté par le navigateur. L'arbitrage est rendu : on garde le
 * défilement amorti et on abandonne l'aimantation, plutôt que de réécrire les
 * points d'arrêt en JavaScript avec `lenis/snap` pour retrouver un
 * comportement que le CSS donnait en trois lignes. Les règles de snap ont donc
 * été retirées de `globals.css` : les laisser aurait entretenu l'idée qu'elles
 * font encore quelque chose.
 *
 * UNE SEULE HORLOGE. Lenis et GSAP ont chacun leur boucle d'animation. Deux
 * boucles, c'est deux horloges qui se décalent de quelques millisecondes : les
 * animations liées au scroll tremblent, sans qu'on puisse jamais le reproduire
 * à coup sûr. On coupe donc celle de Lenis (`autoRaf: false`) et on le fait
 * avancer depuis le ticker de GSAP.
 *
 * `root` : Lenis prend la main sur le scroll du DOCUMENT et ne rend AUCUN
 * conteneur — les enfants sont rendus tels quels. C'est ce qui permet de
 * l'intercaler dans le root layout sans toucher à la colonne flex du <body>.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  /* MOUVEMENTS RÉDUITS. Contrairement à ce que laisse croire son option
     `respectReducedMotion` (active par défaut), Lenis 1.3 ne s'en sert QUE pour
     ses défilements programmés — vérifié dans `node_modules/lenis/dist/lenis.mjs`,
     c'est le seul endroit qui lit la préférence. L'amortissement de la molette,
     lui, reste actif : un utilisateur qui a demandé moins d'animations garderait
     donc la seule qui touche à CHACUN de ses gestes. On coupe explicitement
     `smoothWheel`, ce qui rend le scroll natif tout en laissant Lenis gérer les
     ancres (instantanées dans ce mode). Le reste du site suit la même règle :
     voir le bloc `prefers-reduced-motion` de globals.css et `TransitionLink`.

     Lu après le montage et non au rendu : le serveur ne connaît pas la
     préférence, et un rendu différent ici casserait l'hydratation. Le
     changement d'option recrée l'instance de Lenis — une fois, au montage, et
     seulement pour ces utilisateurs. */
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    function update(time: number) {
      /* Le ticker compte en secondes, Lenis attend des millisecondes.
         L'instance n'existe qu'après le premier effet de `<ReactLenis>` : les
         premières frames ne font donc rien, d'où les `?.`. */
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);
    /* Par défaut, GSAP « rattrape » les images perdues quand l'onglet a été mis
       de côté. Appliqué au scroll, ce rattrapage fait sauter la page au retour
       sur l'onglet. */
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,
        smoothWheel: !reducedMotion,
        /* Lenis gère lui-même les liens d'ancre de la page courante, en
           défilement amorti : le lien d'évitement « Aller au contenu »
           (#contenu), le bouton « Choisir ses billets » (#tarifs) et l'icône
           panier du Header une fois sur /billetterie (#panier). Sans cette
           option, un clic sur une ancre ne ferait plus rien du tout : Lenis
           tient la position de scroll et réécrirait celle du navigateur à la
           frame suivante. Son `scrollTo` lit le `scroll-padding-top` du
           document, la cible se cale donc sous le header collant exactement
           comme avant (vérifié dans `lenis.mjs`).

           ⚠️ Corollaire côté routeur : `TransitionLink` passe `scroll={false}`
           sur ces liens-là, sinon Next saute à l'ancre pendant que Lenis
           l'anime — voir le commentaire sur place. */
        anchors: true,
        /* Les zones qui ont leur propre ascenseur (colonne de filtres de la
           collection, liste du panier, cartel de la fiche œuvre) doivent
           défiler NORMALEMENT sous la molette. Sans ça, Lenis intercepte le
           geste au niveau de la page et ces zones deviennent impossibles à
           faire défiler. L'option détecte le conteneur scrollable survolé et
           lui rend la main tant qu'il peut encore défiler dans ce sens — donc
           pas de `data-lenis-prevent` à poser un par un, et rien à penser pour
           la prochaine zone scrollable du site. */
        allowNestedScroll: true,
        /* Un clic vers une AUTRE page coupe l'inertie en cours. Sinon le
           défilement continue sur sa lancée derrière le panneau de transition,
           et se termine sur la page suivante. */
        stopInertiaOnNavigate: true,
      }}
    >
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  );
}

/**
 * Recale ScrollTrigger sur la position de Lenis à chaque frame de scroll.
 *
 * Sans lui, ScrollTrigger n'apprend la position que par l'événement `scroll` du
 * navigateur, émis moins souvent que les frames écrites par Lenis : les
 * déclenchements arrivent en retard sur ce que voit l'utilisateur.
 *
 * Composant à part parce que `useLenis` lit un contexte React : il doit être
 * rendu SOUS `<ReactLenis>`, pas à côté. Ne rend rien.
 */
function ScrollTriggerSync() {
  useLenis(() => ScrollTrigger.update());

  return null;
}
