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
 * Géométrie de la spirale, à l'échelle de la maquette 1440px. `InfiniteSpiral`
 * calcule des transformations 3D, son API est forcément en pixels :
 * `useFluidScale` remet ces cotes à l'échelle de l'écran réel.
 *
 * Ces valeurs ne sont pas indépendantes, elles reprennent les proportions de la
 * démo d'origine. Deux rapports comptent :
 *
 * 1. rayon / carte ≈ 1.7. Le composant simule la profondeur avec un z-index, qui
 *    s'inverse d'un coup quand deux cartes se croisent. Tant que leur écart
 *    dépasse la largeur apparente d'une carte, l'inversion est invisible ; à 1.3
 *    — ce qui avait été essayé — elle se voit.
 * 2. espacement / carte ≈ 0.6. Le chevauchement donne la densité ; l'écarter
 *    vide la colonne sans corriger le saut, qui dépend du rapport précédent.
 *
 * Troisième contrainte : 2 × rayon + carte doit tenir dans la colonne, sinon
 * l'`overflow-hidden` tranche les cartes. Ici 426px pour 36rem.
 */
const SPIRAL = {
  radius: 165,
  cardWidth: 96,
  cardHeight: 96,
  verticalSpacing: 58,
  perspective: 1000,
};

/**
 * Facteur d'échelle du rem fluide. Sans lui, les cartes garderaient leurs 96px
 * pendant que le texte voisin grandit : la spirale rétrécirait visuellement à
 * mesure que la fenêtre s'agrandit.
 *
 * Valeur de départ 1 plutôt que la vraie mesure : le serveur ne connaît pas la
 * taille de la fenêtre, et rendre autre chose côté serveur provoquerait une
 * erreur d'hydratation.
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
 * Colonne décorative : les reproductions défilent en spirale.
 *
 * C'est ce composant qui connaît le métier ; `InfiniteSpiral` reste une brique
 * `ui/` générique, remplaçable sans toucher au reste.
 *
 * Trois partis pris propres au musée : le cadrage des cartes de la collection
 * (`cover` + `top`, un `contain` laissait un liseré blanc irrégulier), pas de
 * `grayscale` puisque la couleur est le sujet, et aucun lien — les cartes bougent
 * en permanence, une cible mouvante est un problème d'accessibilité.
 */
export function ArtworkSpiral({ artworks, className }: ArtworkSpiralProps) {
  const scale = useFluidScale();

  /* `flatMap` plutôt que filter + map : c'est ce qui permet à TypeScript de
     savoir que `media` n'est pas null dans la branche conservée. */
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
         rotation, deux mouvements superposés et illisibles. */
      animationMode="auto"
      speed={0.55}
      direction="up"
      cardsPerTurn={7}
      centerScale={1.2}
      /* Fondu et flou vers les deux extrémités de la chaîne : c'est ce qui donne
         la profondeur, et la raison pour laquelle la chaîne doit tenir entière
         dans la colonne (voir SPIRAL_ARTWORKS côté page). */
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
