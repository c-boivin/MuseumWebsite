/**
 * Forme brute de la réponse de l'API Museum.
 *
 * Ce fichier décrit ce que l'API envoie, pas ce que le site affiche : la
 * conversion se fait dans `lib/museum.ts`. Le jour où l'API change de format, un
 * seul fichier est à corriger.
 *
 * Tous les champs sauf `id`, `slug` et `title` sont optionnels — la doc prévient
 * que certains peuvent manquer, et les déclarer obligatoires planterait la page
 * à la première œuvre incomplète.
 */
export interface MuseumObject {
  id: number;
  /** Identifiant lisible utilisé dans les URL : "starry-night". */
  slug: string;
  title: string;
  year?: number;
  /** "painting", "fresco", "woodblock print"… */
  type?: string;
  /** Texte riche : contient du HTML. */
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
 * Enveloppe paginée de `GET /objects`.
 *
 * ⚠️ La doc fournie en cours montre un tableau nu — c'est faux, l'API emballe
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
