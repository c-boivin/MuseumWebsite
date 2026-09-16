import { centuryOf, centuryRoman } from "@/lib/facets";
import type { ArtworkList } from "@/types/artwork";

export interface CollectionStats {
  /** Nombre total d'œuvres au catalogue, tel que l'API le compte. */
  artworkCount: number;
  /** Mouvements distincts représentés. */
  movementCount: number;
  /**
   * Période couverte, en chiffres romains : « XVe — XXe ». Chaîne et non paire
   * de nombres : c'est un libellé d'affichage, et le composer ici évite que
   * chaque page réinvente le tiret et l'ordre.
   *
   * `null` si aucune œuvre du catalogue n'est datée — l'API a des champs qui
   * peuvent manquer, et un « null — null » sur la page d'accueil serait pire
   * qu'un chiffre absent.
   */
  centurySpan: string | null;
}

/**
 * Les chiffres clés de la collection, DÉRIVÉS du catalogue.
 *
 * Pourquoi ne pas simplement écrire « 39 œuvres, 12 mouvements » dans le
 * contenu : parce que ce sont des affirmations vérifiables, et qu'un chiffre
 * écrit en dur devient faux à la première œuvre ajoutée à l'API sans que
 * personne ne s'en aperçoive. Un musée qui annonce un nombre d'œuvres inexact
 * sur sa page d'accueil, c'est le genre de détail qui décrédibilise tout le
 * reste.
 *
 * Fonction pure, séparée du composant qui l'affiche : elle se relit et se teste
 * sans monter une page, et elle resservira le jour où la page À propos voudra
 * les mêmes chiffres.
 *
 * `artworkCount` vient de `totalCount` et non de `artworks.length` : ce sont
 * deux nombres différents. `artworks` a déjà été filtré des œuvres sans
 * reproduction exploitable (voir `lib/museum.ts`), alors que `totalCount` est le
 * volume réel du catalogue — c'est celui-là qu'un visiteur attend.
 */
export function collectionStats(list: ArtworkList): CollectionStats {
  const movements = new Set<string>();
  const centuries = new Set<number>();

  for (const artwork of list.artworks) {
    if (artwork.movement) movements.add(artwork.movement);

    const century = centuryOf(artwork.year);
    if (century !== null) centuries.add(century);
  }

  const sorted = [...centuries].sort((a, b) => a - b);

  return {
    artworkCount: list.totalCount,
    movementCount: movements.size,
    centurySpan:
      sorted.length === 0
        ? null
        : `${centuryRoman(sorted[0])} — ${centuryRoman(sorted[sorted.length - 1])}`,
  };
}
