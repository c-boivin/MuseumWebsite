/**
 * Manipulation des URL d'images Wikimedia.
 *
 * POURQUOI CE FICHIER EXISTE : Wikimedia ne génère plus de vignette à la largeur
 * qu'on lui demande. Depuis 2025, seule une liste fixe de largeurs est servie en
 * accès direct ; toute autre taille est **rejetée en HTTP 400** (« Use thumbnail
 * sizes listed on… »), même si l'URL fonctionnait quand elle a été copiée.
 * L'API du cours date d'avant ce changement : elle est pleine d'URL en `2560px-`
 * et `2880px-`, et 22 des 41 images ne se chargeaient pas.
 *
 * Source : https://www.mediawiki.org/wiki/Common_thumbnail_sizes
 *
 * La base de ce fichier (la liste, le motif, `isWikimediaThumbnail` et
 * `getWikimediaThumbnail`) vient du correctif distribué en cours. Le reste est
 * une addition maison, signalée comme telle plus bas.
 */

/** Largeurs de vignette encore servies par Wikimedia. */
export const WIKIMEDIA_THUMBNAIL_WIDTHS = [
  120, 250, 330, 500, 960, 1280, 1920, 3840,
];

/**
 * Une URL de vignette : `…/thumb/<a>/<ab>/<fichier>/<largeur>px-<fichier>`.
 * Les deux groupes isolent ce qui encadre la largeur, pour pouvoir la remplacer.
 */
const THUMBNAIL_URL =
  /^(https:\/\/upload\.wikimedia\.org\/.+\/thumb\/.+)\/\d+px-([^/]+)$/;

/**
 * La plus petite largeur standard capable de couvrir celle demandée.
 *
 * Extrait de `getWikimediaThumbnail` pour être partagé avec la réécriture des
 * fichiers originaux — même règle d'arrondi des deux côtés, sans la dupliquer.
 */
function standardWidthFor(width: number): number {
  return (
    WIKIMEDIA_THUMBNAIL_WIDTHS.find((candidate) => candidate >= width) ??
    WIKIMEDIA_THUMBNAIL_WIDTHS[WIKIMEDIA_THUMBNAIL_WIDTHS.length - 1]
  );
}

/** L'URL désigne-t-elle déjà une vignette Wikimedia ? */
export function isWikimediaThumbnail(src: string): boolean {
  return THUMBNAIL_URL.test(src);
}

/**
 * Remplace la largeur d'une URL de vignette par la taille standard adéquate.
 *
 * Une URL qui n'est pas une vignette Wikimedia ressort inchangée : `replace` ne
 * fait rien quand le motif ne correspond pas.
 */
export function getWikimediaThumbnail(src: string, width: number): string {
  return src.replace(THUMBNAIL_URL, `$1/${standardWidthFor(width)}px-$2`);
}

/* ────────────────────────── addition maison ──────────────────────────
   Le correctif du cours ne traite que les vignettes. Or l'API renvoie aussi des
   URL SANS `/thumb/`, qui désignent le fichier SOURCE — parfois plusieurs
   dizaines de mégaoctets. `next/image` le télécharge pour l'optimiser et
   abandonne sur expiration du délai : l'œuvre tombe alors sur le cadre de
   remplacement, sans que rien n'indique pourquoi.

   Vérifié : Wikimedia sert une vignette même quand le fichier source est plus
   petit que la largeur demandée. La réécriture est donc toujours sûre.

   Si tu veux t'en tenir strictement au code du cours, supprime ce bloc et
   remplace les appels à `getWikimediaImageUrl` par `getWikimediaThumbnail` :
   rien d'autre ne casse, on perd juste cette protection.
   ──────────────────────────────────────────────────────────────────── */

/**
 * Le fichier original : `…/wikipedia/<projet>/<a>/<ab>/<fichier>`.
 *
 * Limité aux formats matriciels : la vignette d'un SVG s'appellerait
 * `<largeur>px-<fichier>.svg.png`, un cas que l'API ne produit pas.
 */
const ORIGINAL_FILE_URL =
  /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[^/]+\/)([0-9a-f]\/[0-9a-f]{2}\/)([^/?#]+\.(?:jpe?g|png))$/i;

/**
 * Ramène n'importe quelle URL Wikimedia à une vignette de la largeur voulue.
 *
 * C'est la fonction que le reste du site appelle : elle couvre les deux formes
 * d'URL que l'API produit. Toute URL étrangère à Wikimedia ressort inchangée.
 */
export function getWikimediaImageUrl(src: string, width: number): string {
  if (isWikimediaThumbnail(src)) return getWikimediaThumbnail(src, width);

  return src.replace(
    ORIGINAL_FILE_URL,
    `$1thumb/$2$3/${standardWidthFor(width)}px-$3`,
  );
}
