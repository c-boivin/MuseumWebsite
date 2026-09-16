"use client";

import { useEffect, useState } from "react";
import {
  InfiniteSpiral,
  type InfiniteSpiralItem,
} from "@/components/ui/InfiniteSpiral";
import type { ArtworkPreview } from "@/types/artwork";

/** Valeur du rem sur la maquette de référence 1440px. Voir `globals.css`. */
const REFERENCE_REM = 16;

/**
 * Géométrie de la spirale, **exprimée à l'échelle de la maquette 1440px**.
 *
 * `InfiniteSpiral` calcule des transformations 3D : son API est forcément en
 * pixels, aucune de ces valeurs ne peut s'écrire en rem. On les note donc comme
 * des cotes de maquette, et `useFluidScale` ci-dessous les remet à l'échelle de
 * l'écran réel — ce qui revient exactement à les avoir écrites en rem.
 *
 * CES VALEURS NE SONT PAS INDÉPENDANTES. Elles reprennent les proportions de la
 * démo d'origine (rayon 170, carte 100, espacement 60), qui sont ce qui fait
 * tenir l'effet. Deux rapports comptent :
 *
 * 1. **rayon / carte ≈ 1.7.** C'est lui qui supprime le saut au changement de
 *    superposition. Le composant simule la profondeur avec un z-index : quand
 *    deux cartes se croisent en profondeur, leur ordre d'empilement s'inverse
 *    d'un coup. Elles se croisent quand elles sont symétriques par rapport à
 *    l'axe, donc écartées horizontalement de 2 x rayon x sin(180/cardsPerTurn) —
 *    soit 0.87 x rayon à 7 cartes par tour. Tant que cet écart dépasse la largeur
 *    apparente d'une carte (la sienne x 1.4 une fois mise à l'échelle par la
 *    perspective), l'inversion se produit alors qu'elles ne se recouvrent pas :
 *    invisible. Descendre à 1.3 — ce qui avait été fait ici — la rend visible.
 * 2. **espacement / carte ≈ 0.6.** Les cartes se chevauchent franchement de haut
 *    en bas. C'est ce chevauchement qui donne la densité ; l'écarter vide la
 *    colonne sans rien corriger, puisque le saut dépend du rapport ci-dessus.
 *
 * Troisième contrainte, indépendante : **2 x rayon + carte doit tenir dans la
 * largeur de la colonne**, sinon les cartes ressortent sur les côtés et sont
 * tranchées par l'`overflow-hidden` du composant. Ici 2 x 165 + 96 = 426px pour
 * une colonne de 36rem (576px) : 75px de marge de chaque côté.
 */
const SPIRAL = {
  radius: 165,
  cardWidth: 96,
  cardHeight: 96,
  verticalSpacing: 58,
  perspective: 1000,
};

/**
 * Facteur d'échelle du rem fluide : 1 sur un écran de 1440px, 1.33 au-delà de
 * 1920, moins en dessous.
 *
 * Sans lui, les cartes garderaient leurs 96px pendant que le texte voisin, lui,
 * grandirait avec l'écran : la spirale rétrécirait visuellement à mesure que la
 * fenêtre s'agrandit. C'est la transposition de la règle « tout en rem » à un
 * composant qui ne sait parler qu'en pixels. Toutes les cotes étant multipliées
 * par le même facteur, les rapports ci-dessus sont préservés.
 *
 * Valeur de départ 1 plutôt que la vraie mesure : le serveur ne connaît pas la
 * taille de la fenêtre, et rendre autre chose côté serveur que côté client
 * provoquerait une erreur d'hydratation.
 */
function useFluidScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const read = () => {
      const rem = Number.parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      if (Number.isFinite(rem)) setScale(rem / REFERENCE_REM);
    };

    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  return scale;
}

interface ArtworkSpiralProps {
  /** Œuvres à faire tourner. Celles sans reproduction sont ignorées. */
  artworks: readonly ArtworkPreview[];
  className?: string;
}

/**
 * Colonne décorative : les reproductions de la collection défilent en spirale.
 *
 * C'est ce composant, et non `InfiniteSpiral`, qui connaît le métier — il traduit
 * des œuvres en éléments de spirale et fixe le parti pris visuel. `InfiniteSpiral`
 * reste une brique `ui/` générique, remplaçable sans toucher au reste.
 *
 * Trois partis pris propres au musée, tous discutables en une prop :
 * - **`imageFit="cover"` + `imagePosition="top"`** : exactement le cadrage des
 *   cartes de la collection. En `contain`, l'œuvre gardait ses proportions mais
 *   laissait deux bandes vides dans la carte carrée — un liseré blanc irrégulier
 *   d'une carte à l'autre. L'ancrage haut rend le rognage supportable : dans un
 *   portrait peint, le visage est dans le tiers haut. L'œuvre entière reste
 *   visible sur sa fiche.
 * - **pas de `grayscale`** : la couleur est le sujet d'un musée de peinture, et
 *   la charte du site est volontairement neutre pour la laisser parler.
 * - **aucun lien** : les cartes bougent en permanence. Un lien qu'il faut
 *   poursuivre à la souris est une cible mouvante, donc un problème
 *   d'accessibilité. La navigation vers les œuvres passe par `/collection`.
 */
export function ArtworkSpiral({ artworks, className }: ArtworkSpiralProps) {
  const scale = useFluidScale();

  /* flatMap plutôt que filter + map : c'est ce qui permet à TypeScript de savoir
     que `media` n'est pas null dans la branche conservée. Un `.filter()` ne
     restreint pas le type de ce qui en sort. */
  const items = artworks.flatMap<InfiniteSpiralItem>((artwork) =>
    artwork.media
      ? [
          {
            id: artwork.slug,
            src: artwork.media.src,
            alt: artwork.media.alt,
          },
        ]
      : [],
  );

  if (items.length === 0) return null;

  return (
    <InfiniteSpiral
      items={items}
      className={className}
      /* "auto" et non "all" : le mode "all" ajoutait la vitesse du scroll à la
         rotation propre. La colonne défilait donc déjà avec la page ET tournait
         plus vite en même temps — deux mouvements superposés, illisibles. Ici la
         spirale tourne à sa vitesse, indépendamment du scroll. */
      animationMode="auto"
      speed={0.55}
      direction="up"
      cardsPerTurn={7}
      centerScale={1.2}
      /* Fondu et flou progressifs vers les DEUX EXTRÉMITÉS DE LA CHAÎNE : nettes
         au centre, les cartes se voilent puis disparaissent en s'en éloignant.
         C'est ce qui donne la profondeur — et c'est pour ça que la chaîne doit
         tenir entière dans la colonne (voir SPIRAL_ARTWORKS côté page) : si elle
         la dépassait, les cartes seraient tranchées net avant d'avoir commencé
         à s'effacer. */
      edgeFade={0.3}
      edgeBlur={6}
      imageFit="cover"
      imagePosition="top"
      pauseOnHover
      radius={SPIRAL.radius * scale}
      cardWidth={SPIRAL.cardWidth * scale}
      cardHeight={SPIRAL.cardHeight * scale}
      verticalSpacing={SPIRAL.verticalSpacing * scale}
      perspective={SPIRAL.perspective * scale}
      /* Angles vifs, comme les cartes de la collection. */
      cardRadius={0}
    />
  );
}
