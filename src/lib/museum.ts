import { imageOverrides } from "@/data/image-overrides";
import { isDisplayableImageUrl } from "@/lib/image-hosts";
import { getWikimediaImageUrl } from "@/lib/wikimedia";
import type { Artwork, ArtworkList, ArtworkPreview } from "@/types/artwork";
import type { ImageMedia } from "@/types/media";
import type { MuseumListResponse, MuseumObject } from "@/types/museum-api";

/**
 * Client de l'API Museum.
 *
 * SEUL fichier du projet qui connaît l'existence de cette API. Les pages et les
 * composants appellent `getArtworks()` / `getArtwork()` et reçoivent des objets
 * déjà normalisés : ils ignorent l'URL, la pagination et le format de réponse.
 * C'est ce qui permettrait d'en changer sans toucher une seule vue.
 */

const API_URL = "https://api-museum.vercel.app";

/**
 * Durée de fraîcheur du cache, en secondes.
 *
 * Depuis Next 15, `fetch` n'est PLUS mis en cache par défaut : sans cette option,
 * chaque visiteur déclencherait un appel réseau et la page ne pourrait jamais
 * être pré-rendue. Avec elle, la page est générée une fois puis resservie telle
 * quelle pendant une heure, et régénérée en arrière-plan ensuite (ISR).
 *
 * Une heure est un compromis assumé : le catalogue d'un musée ne change pas
 * toutes les minutes, et la note du projet valorise une stratégie de rendering
 * explicite plutôt que subie.
 */
const REVALIDATE_SECONDS = 3600;

interface ListParams {
  /** Page demandée, 1 par défaut. */
  page?: number;
  /** Nombre d'œuvres par page. Sans limite, l'API renvoie tout (39 œuvres). */
  limit?: number;
  /** Recherche plein texte sur le titre et l'artiste. */
  search?: string;
  /** Filtre sur le nom exact de l'artiste. */
  artist?: string;
}

/**
 * Appelle l'API et renvoie la réponse déjà décodée.
 *
 * `notFound` n'est pas traité ici comme une erreur : c'est à l'appelant de
 * décider quoi en faire (afficher une 404, ou ignorer). D'où le `null`.
 */
async function request<T>(path: string): Promise<T | null> {
  const response = await fetch(`${API_URL}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    /* On laisse remonter : l'error.tsx du segment affichera un message propre
       plutôt que de rendre une page à moitié vide. */
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
 * Construit le texte alternatif d'une reproduction.
 *
 * Il est généré plutôt que saisi parce que l'API n'en fournit aucun. Un `alt`
 * vide ferait échouer le critère d'accessibilité du projet ; un `alt` qui répète
 * seulement le titre n'apprend rien à un lecteur d'écran, d'où l'ajout de
 * l'artiste et de la nature de l'objet montré.
 */
function buildAlt(object: MuseumObject, index = 0): string {
  const artist = orNull(object.artist);
  const subject = artist ? `${object.title}, par ${artist}` : object.title;
  return index === 0
    ? `Reproduction de l'œuvre ${subject}`
    : `Détail ${index} de l'œuvre ${subject}`;
}

/**
 * Largeur demandée à Wikimedia selon l'endroit où l'image sera affichée.
 *
 * POURQUOI DEUX VALEURS plutôt qu'une seule bien large : `next/image` ne
 * redimensionne pas l'image chez Wikimedia, il la TÉLÉCHARGE puis la
 * redimensionne chez nous. Demander du 1920px pour des vignettes de grille,
 * c'est faire transiter 39 fichiers de ~1,1 Mo pour afficher des cartes de
 * 400 px — et se faire limiter par Wikimedia (**HTTP 429**), qui renvoie alors
 * des images vides sur toute la page.
 *
 * Les deux valeurs sont calées sur la maquette 1440 px, doublées pour les écrans
 * à forte densité, puis arrondies à la taille standard supérieure.
 */
const THUMBNAIL_WIDTH = {
  /** Carte de grille : ~400 px affichés, 800 px sur un écran ×2. */
  card: 960,
  /** Reproduction principale d'une fiche : ~860 px affichés, 1720 px en ×2. */
  detail: 1920,
} as const;

/**
 * Emballe une URL distante dans le contrat attendu par <Media />.
 *
 * Sans `width` ni `height` : on ne connaît pas les dimensions d'une image qu'on
 * n'a pas téléchargée. <Media /> le détecte et passe en mode `fill`.
 */
function toImageMedia(
  src: string,
  alt: string,
  wanted: number,
): ImageMedia | null {
  /* L'override d'abord — il corrige une URL carrément fausse — puis la mise en
     forme, qui s'applique aussi bien à l'URL d'origine qu'à sa correction. */
  const corrected = getWikimediaImageUrl(imageOverrides[src] ?? src, wanted);

  /* Dernier filtre : une URL malformée ou hébergée sur un domaine non déclaré
     ferait échouer next/image en 400. Autant le savoir maintenant et rendre le
     cadre de remplacement, plutôt qu'une image cassée dans la page. */
  /* `unoptimized` : l'URL désigne déjà une vignette à la largeur voulue, servie
     par le CDN de Wikimedia. La repasser par l'optimiseur de Next obligerait
     notre serveur à la télécharger — 39 téléchargements simultanés pour une
     grille, ce que Wikimedia refuse en **429**. Voir le commentaire détaillé
     dans `components/ui/Media.tsx`. */
  return isDisplayableImageUrl(corrected)
    ? { type: "image", src: corrected, alt, unoptimized: true }
    : null;
}

/**
 * API brute → aperçu affichable.
 *
 * Une œuvre sans reproduction exploitable n'est PAS écartée : elle reçoit
 * `media: null` et le site lui affiche un cadre de remplacement. Le catalogue
 * reflète ainsi toute la base, même incomplète — une œuvre ajoutée sans visuel
 * reste consultable, avec son cartel et sa notice.
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
  /* La fiche affiche la reproduction en grand : on redemande donc l'aperçu dans
     la largeur qui convient à ce contexte, pas celle des cartes de grille. */
  const preview = toArtworkPreview(object, THUMBNAIL_WIDTH.detail);

  /* `gallery` rejoue presque toujours l'image principale en première position :
     on la retire pour ne pas l'afficher deux fois sur la fiche. Les vues dont
     l'URL est inexploitable disparaissent simplement — inutile d'aligner des
     cadres de remplacement sous la reproduction principale. */
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
    /* Surtout PAS `.map(toArtworkPreview)` : `map` passe (élément, index, tableau)
       à sa fonction, l'index atterrirait dans `wanted` et le site demanderait des
       vignettes de 20 px. C'est arrivé — d'où le paramètre rendu obligatoire. */
    artworks: data.objects.map((object) =>
      toArtworkPreview(object, THUMBNAIL_WIDTH.card),
    ),
    totalCount: data.totalCount,
    currentPage: data.currentPage,
    totalPages: data.totalPages,
  };
}

/**
 * Une œuvre par son slug. `null` si elle n'existe pas — à la page d'appeler
 * `notFound()`, parce qu'elle seule sait comment réagir.
 */
export async function getArtwork(slug: string): Promise<Artwork | null> {
  const object = await request<MuseumObject>(
    `/objects/${encodeURIComponent(slug)}`,
  );
  return object ? toArtwork(object) : null;
}

/**
 * Un lot d'œuvres CHOISIES, dans l'ordre demandé.
 *
 * Pourquoi une fonction à part plutôt qu'un `getArtworks()` qu'on filtrerait :
 * l'API ne sait pas répondre à « ces six-là ». Filtrer côté site obligerait à
 * télécharger les 39 œuvres pour en garder six, et surtout à les recevoir dans
 * l'ordre de l'API — or ici l'ordre est éditorial, il fait partie du choix.
 *
 * `Promise.all` et non une boucle `await` : les six requêtes sont indépendantes,
 * les enchaîner ferait attendre six allers-retours au lieu d'un.
 *
 * Une œuvre introuvable est simplement retirée du lot plutôt que de faire échouer
 * l'ensemble : un slug qui disparaîtrait du catalogue laisserait un panneau en
 * moins sur l'accueil, pas une page en erreur.
 *
 * Largeur `card` et non `detail` : ces aperçus alimentent des vignettes, jamais
 * une reproduction plein cadre.
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
 * Tous les slugs du catalogue, pour `generateStaticParams`.
 *
 * Fonction dédiée plutôt qu'un `getArtworks()` dont on jetterait 90 % du
 * résultat : la lecture du code de la page dit alors exactement ce qu'elle fait.
 */
export async function getArtworkSlugs(): Promise<string[]> {
  const { artworks } = await getArtworks();
  return artworks.map((artwork) => artwork.slug);
}
