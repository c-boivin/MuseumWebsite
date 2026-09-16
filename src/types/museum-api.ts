/**
 * Forme BRUTE de la réponse de l'API Museum (https://api-museum.vercel.app).
 *
 * Ce fichier décrit ce que l'API envoie, pas ce que le site affiche. La
 * conversion vers nos propres types (`ArtworkPreview`, `Artwork`) se fait dans
 * `lib/museum.ts`. Cette frontière est volontaire : le jour où l'API change de
 * format, un seul fichier est à corriger et aucun composant ne bouge.
 *
 * Tous les champs sauf `id`, `slug` et `title` sont optionnels : la doc de l'API
 * prévient que « certains champs peuvent parfois manquer ». Les déclarer
 * obligatoires ferait mentir TypeScript et planterait la page à la première œuvre
 * incomplète.
 */
export interface MuseumObject {
  id: number;
  /** Identifiant lisible utilisé dans les URL : "starry-night", "mona-lisa"… */
  slug: string;
  title: string;
  year?: number;
  /** "painting", "fresco", "woodblock print"… */
  type?: string;
  /** Texte riche : contient du HTML (<p>, <strong>, <i>). */
  description?: string;
  /** Visuel principal, URL absolue. */
  image?: string;
  /** Visuels additionnels. Le premier est souvent identique à `image`. */
  gallery?: string[];
  artist?: string;
  location?: string;
  locationLink?: string;
  movement?: string;
  color?: string;
}

/**
 * Enveloppe paginée renvoyée par `GET /objects`.
 *
 * ⚠️ La doc fournie en cours montre un tableau nu — c'est faux : l'API emballe
 * les œuvres dans cet objet. Vérifié sur l'API en ligne.
 */
export interface MuseumListResponse {
  objects: MuseumObject[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Corps renvoyé avec un statut 404 ou 500. */
export interface MuseumError {
  error: string;
}
