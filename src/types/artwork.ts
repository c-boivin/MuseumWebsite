import type { ImageMedia } from "./media";

/**
 * Une œuvre telle que le SITE la manipule — pas telle que l'API l'envoie.
 *
 * Deux différences avec `MuseumObject` (types/museum-api.ts), et elles sont le
 * cœur de la normalisation faite dans `lib/museum.ts` :
 *
 * 1. `null` plutôt qu'`undefined` pour un champ absent. Un champ à `null` est un
 *    choix explicite (« l'info n'existe pas »), là qu'`undefined` peut aussi
 *    vouloir dire « j'ai oublié de le remplir ». Les composants n'ont plus qu'un
 *    seul cas à traiter.
 * 2. L'image devient un `ImageMedia`, le contrat que <Media /> sait afficher. Les
 *    composants ne voient jamais une URL brute.
 */
export interface ArtworkPreview {
  /** Clé d'URL : /collection/starry-night. C'est l'identifiant public de l'œuvre. */
  slug: string;
  title: string;
  artist: string | null;
  year: number | null;
  /** Mouvement artistique : "Impressionnisme", "Surréalisme"… */
  movement: string | null;
  /**
   * Couleur dominante en toutes lettres : "Bleu cobalt profond".
   *
   * Présente dès l'aperçu, et pas seulement sur la fiche, parce que la page
   * Collection filtre dessus — voir `lib/facets.ts`, qui en extrait des teintes.
   */
  color: string | null;
  /**
   * `null` quand aucune reproduction n'est exploitable : champ `image` absent,
   * URL malformée, ou domaine que le site n'accepte pas. L'œuvre reste au
   * catalogue, <Media /> affiche un cadre de remplacement à la place.
   */
  media: ImageMedia | null;
}

/**
 * Fiche complète d'une œuvre, affichée sur /collection/[slug].
 *
 * Elle étend l'aperçu plutôt que de le dupliquer : une carte de grille peut donc
 * recevoir un `Artwork` complet sans transformation, l'inverse étant impossible.
 */
export interface Artwork extends ArtworkPreview {
  /** "painting", "fresco"… laissé en anglais, comme le reste des données API. */
  type: string | null;
  /** ⚠️ Chaîne HTML, pas du texte brut. Voir ArtworkDescription. */
  description: string | null;
  location: string | null;
  locationLink: string | null;
  /** Visuels additionnels, le principal exclu. Vide si l'API n'en fournit pas. */
  gallery: ImageMedia[];
}

/** Résultat d'une liste paginée : les œuvres + de quoi afficher la pagination. */
export interface ArtworkList {
  artworks: ArtworkPreview[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}
