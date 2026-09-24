import { site } from "@/data/site";
import { centuryOf, centuryRoman } from "@/lib/facets";
import type { ArtworkList } from "@/types/artwork";

export interface CollectionStats {
  /** Nombre total d'œuvres au catalogue, tel que l'API le compte. */
  artworkCount: number;
  /** Mouvements distincts représentés. */
  movementCount: number;
  /**
   * Période couverte, en chiffres romains : « XVe — XXe ». Une chaîne parce que
   * c'est un libellé, et la composer ici évite que chaque page réinvente le
   * tiret. `null` si aucune œuvre n'est datée, plutôt qu'un « null — null ».
   */
  centurySpan: string | null;
}

/**
 * Les chiffres clés de la collection, dérivés du catalogue.
 *
 * Écrire « 39 œuvres » en dur deviendrait faux à la première œuvre ajoutée sans
 * que personne s'en aperçoive — un musée qui annonce un nombre inexact sur sa
 * page d'accueil décrédibilise le reste.
 *
 * `artworkCount` vient de `totalCount` et non de `artworks.length` : ce dernier
 * a déjà été filtré des œuvres sans reproduction (voir `lib/museum.ts`), alors
 * que `totalCount` est le volume réel du catalogue.
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
 * Les chiffres de l'institution, par opposition à ceux de la collection.
 *
 * Les deux séries ne se mélangent pas : `collectionStats` décrit ce qu'on vient
 * voir et se dérive de l'API, `museumStats` décrit la maison et se dérive de
 * `data/site.ts`. L'accueil les montre à deux endroits différents.
 *
 * Rien n'est écrit en dur : l'âge du musée se recalcule à chaque régénération,
 * donc il vieillit tout seul. Un « 48 ans » recopié serait faux dès le 1er
 * janvier suivant.
 *
 * Le cumul de visiteurs est une estimation — fréquentation moyenne × années — et
 * non un relevé. Affiché en notation abrégée (« 8,6 M ») : un « 8 640 000 »
 * serait un mensonge de précision.
 */
export function museumStats(now: Date = new Date()): MuseumStats {
  const yearsOpen = Math.max(0, now.getFullYear() - site.openedIn);

  return {
    yearsOpen,
    visitorsSinceOpening: yearsOpen * site.annualVisitors,
  };
}
