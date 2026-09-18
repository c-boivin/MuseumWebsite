import { site } from "@/data/site";
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
export interface MuseumStats {
  /** Nombre d'années écoulées depuis l'ouverture au public. */
  yearsOpen: number;
  /** Cumul estimé des visiteurs depuis l'ouverture. */
  visitorsSinceOpening: number;
}

/**
 * Les chiffres de l'INSTITUTION, par opposition à ceux de la collection
 * ci-dessus.
 *
 * Pourquoi les deux séries ne se mélangent pas : `collectionStats` décrit ce
 * qu'on vient voir et se dérive de l'API, `museumStats` décrit la maison qui
 * l'expose et se dérive de `data/site.ts`. Ce sont deux sources, deux rythmes
 * de mise à jour, et l'accueil les montre à deux endroits différents — les
 * chiffres du musée dans l'accroche, ceux du fonds dans le bloc éditorial.
 *
 * MÊME RÈGLE QUE POUR LE CATALOGUE : rien n'est écrit en dur. L'âge du musée
 * se recalcule à chaque régénération de la page, donc il vieillit tout seul ;
 * un « 48 ans » recopié dans un composant serait faux dès le 1er janvier
 * suivant, et c'est exactement le genre de chiffre que personne ne pense à
 * relire.
 *
 * LE CUMUL DE VISITEURS EST UNE ESTIMATION — fréquentation annuelle moyenne ×
 * nombre d'années — et non un relevé. Le projet n'a aucune donnée réelle de
 * fréquentation, et inventer une suite de chiffres annuels n'aurait pas rendu
 * l'estimation plus vraie, seulement plus longue à écrire. Il est affiché en
 * notation abrégée (« 8,6 M ») pour ne pas prêter à une précision qu'il n'a
 * pas : un « 8 640 000 » exact serait un mensonge de précision.
 */
export function museumStats(now: Date = new Date()): MuseumStats {
  const yearsOpen = Math.max(0, now.getFullYear() - site.openedIn);

  return {
    yearsOpen,
    visitorsSinceOpening: yearsOpen * site.annualVisitors,
  };
}
