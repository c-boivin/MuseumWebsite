import { imageOverrides } from "@/data/image-overrides";
import { isDisplayableImageUrl } from "@/lib/image-hosts";
import { getWikimediaImageUrl } from "@/lib/wikimedia";
import type { Artwork, ArtworkList, ArtworkPreview } from "@/types/artwork";
import type { ImageMedia } from "@/types/media";
import type { MuseumListResponse, MuseumObject } from "@/types/museum-api";

/**
 * Client de l'API Museum.
 *
 * Seul fichier du projet qui connaît cette API : les pages appellent
 * `getArtworks()` / `getArtwork()` et reçoivent des objets déjà normalisés.
 */

const API_URL = "https://api-museum.vercel.app";

/**
 * Depuis Next 15, `fetch` n'est plus mis en cache par défaut : sans cette
 * option, chaque visiteur déclencherait un appel et la page ne serait jamais
 * pré-rendue. Une heure, le catalogue d'un musée ne bouge pas plus vite.
 */
const REVALIDATE_SECONDS = 3600;

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  /** Recherche PARTIELLE et insensible à la casse, voir `getArtworksByArtist`. */
  artist?: string;
}

/**
 * `notFound` n'est pas une erreur ici : c'est à l'appelant de décider quoi en
 * faire. D'où le `null`.
 */
async function request<T>(path: string): Promise<T | null> {
  const response = await fetch(`${API_URL}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    /* Laissé remonter : l'error.tsx du segment affichera un message propre. */
    throw new Error(
      `API Museum : ${response.status} ${response.statusText} sur ${path}`,
    );
  }

  return (await response.json()) as T;
}

/** Transforme une chaîne vide ou absente en `null`. Voir types/artwork.ts. */
function orNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * L'API ne fournit aucun texte alternatif. Répéter seulement le titre
 * n'apprendrait rien à un lecteur d'écran, d'où l'artiste et la nature de la vue.
 */
function buildAlt(object: MuseumObject, index = 0): string {
  const artist = orNull(object.artist);
  const subject = artist ? `${object.title}, par ${artist}` : object.title;
  return index === 0
    ? `Reproduction de l'œuvre ${subject}`
    : `Détail ${index} de l'œuvre ${subject}`;
}

/**
 * Largeur demandée à Wikimedia selon le contexte d'affichage.
 *
 * Deux valeurs et non une seule bien large : demander du 1920 px pour des
 * vignettes ferait transiter 39 fichiers de ~1,1 Mo et Wikimedia limite (429).
 * Calées sur la maquette 1440 px, doublées pour les écrans à forte densité.
 */
const THUMBNAIL_WIDTH = {
  card: 960,
  detail: 1920,
} as const;

/**
 * Emballe une URL distante dans le contrat de <Media />.
 *
 * Sans `width` ni `height` : on ne connaît pas les dimensions d'une image qu'on
 * n'a pas téléchargée. <Media /> le détecte et passe en `fill`.
 *
 * `unoptimized` : l'URL désigne déjà une vignette à la bonne largeur servie par
 * le CDN de Wikimedia. La repasser par l'optimiseur obligerait notre serveur à
 * la télécharger — 39 téléchargements simultanés pour une grille, que Wikimedia
 * refuse en 429. Voir `components/ui/Media.tsx`.
 */
function toImageMedia(
  src: string,
  alt: string,
  wanted: number,
): ImageMedia | null {
  /* L'override d'abord — il corrige une URL fausse — puis la mise en forme. */
  const corrected = getWikimediaImageUrl(imageOverrides[src] ?? src, wanted);

  /* Une URL malformée ou sur un domaine non déclaré ferait échouer next/image
     en 400 : mieux vaut rendre le cadre de remplacement. */
  return isDisplayableImageUrl(corrected)
    ? { type: "image", src: corrected, alt, unoptimized: true }
    : null;
}

/**
 * API brute → aperçu affichable.
 *
 * Une œuvre sans reproduction n'est pas écartée : elle reçoit `media: null` et
 * un cadre de remplacement, pour que le catalogue reflète toute la base.
 */
function toArtworkPreview(
  object: MuseumObject,
  wanted: number,
): ArtworkPreview {
  const image = orNull(object.image);

  return {
    slug: object.slug,
    title: object.title,
    artist: orNull(object.artist),
    year: typeof object.year === "number" ? object.year : null,
    movement: orNull(object.movement),
    color: orNull(object.color),
    media: image ? toImageMedia(image, buildAlt(object), wanted) : null,
  };
}

/** API brute → fiche complète. */
function toArtwork(object: MuseumObject): Artwork {
  const preview = toArtworkPreview(object, THUMBNAIL_WIDTH.detail);

  /* `gallery` rejoue presque toujours l'image principale en première position :
     on la retire pour ne pas l'afficher deux fois. */
  const gallery = (object.gallery ?? [])
    .map((src, index) =>
      toImageMedia(src, buildAlt(object, index + 1), THUMBNAIL_WIDTH.detail),
    )
    .filter(
      (media): media is ImageMedia =>
        media !== null && media.src !== preview.media?.src,
    );

  return {
    ...preview,
    type: orNull(object.type),
    description: orNull(object.description),
    location: orNull(object.location),
    locationLink: orNull(object.locationLink),
    gallery,
  };
}

/** Liste des œuvres, paginée. */
export async function getArtworks(
  params: ListParams = {},
): Promise<ArtworkList> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.artist) query.set("artist", params.artist);

  const suffix = query.size > 0 ? `?${query}` : "";
  const data = await request<MuseumListResponse>(`/objects${suffix}`);

  if (!data) {
    return { artworks: [], totalCount: 0, currentPage: 1, totalPages: 0 };
  }

  return {
    /* Surtout pas `.map(toArtworkPreview)` : `map` passe (élément, index,
       tableau), l'index atterrirait dans `wanted` et on demanderait des
       vignettes de 20 px. C'est arrivé, d'où le paramètre obligatoire. */
    artworks: data.objects.map((object) =>
      toArtworkPreview(object, THUMBNAIL_WIDTH.card),
    ),
    totalCount: data.totalCount,
    currentPage: data.currentPage,
    totalPages: data.totalPages,
  };
}

/** Une œuvre par son slug. `null` si elle n'existe pas : à la page d'appeler `notFound()`. */
export async function getArtwork(slug: string): Promise<Artwork | null> {
  const object = await request<MuseumObject>(
    `/objects/${encodeURIComponent(slug)}`,
  );
  return object ? toArtwork(object) : null;
}

/**
 * Un lot d'œuvres choisies, dans l'ordre demandé.
 *
 * L'API ne sait pas répondre à « ces six-là » : filtrer côté site obligerait à
 * télécharger les 39 œuvres et à perdre l'ordre, qui est éditorial.
 *
 * `Promise.all` : les six requêtes sont indépendantes. Une œuvre introuvable est
 * retirée du lot plutôt que de faire échouer l'ensemble.
 */
export async function getArtworkPreviews(
  slugs: readonly string[],
): Promise<ArtworkPreview[]> {
  const objects = await Promise.all(
    slugs.map((slug) =>
      request<MuseumObject>(`/objects/${encodeURIComponent(slug)}`),
    ),
  );

  return objects
    .filter((object): object is MuseumObject => object !== null)
    .map((object) => toArtworkPreview(object, THUMBNAIL_WIDTH.card));
}

/**
 * Les autres œuvres du même artiste, celle qu'on regarde exclue.
 *
 * `?artist=` est le seul filtre exposé par l'API. Conséquence assumée : six
 * artistes seulement ont plus d'une œuvre, donc 26 fiches sur 39 n'affichent
 * aucune suggestion.
 *
 * ⚠️ C'est une recherche PARTIELLE et insensible à la casse, pas une égalité
 * (la doc du cours dit « nom exact »). Sans conséquence ici puisqu'on passe le
 * nom complet lu sur l'œuvre, mais à savoir avant de le brancher sur une saisie.
 */
export async function getArtworksByArtist(
  artist: string | null,
  excludeSlug: string,
): Promise<ArtworkPreview[]> {
  if (artist === null) return [];

  const { artworks } = await getArtworks({ artist });
  return artworks.filter((artwork) => artwork.slug !== excludeSlug);
}

/** Tous les slugs du catalogue, pour `generateStaticParams`. */
export async function getArtworkSlugs(): Promise<string[]> {
  const { artworks } = await getArtworks();
  return artworks.map((artwork) => artwork.slug);
}
