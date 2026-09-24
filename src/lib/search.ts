import type { ArtworkPreview } from "@/types/artwork";

/**
 * Recherche texte dans le catalogue.
 *
 * Ici et non dans le composant parce que ce sont des fonctions pures : elles se
 * relisent, se testent et se réutilisent seules.
 */

/**
 * En dessous, la recherche n'a aucun pouvoir de discrimination : « mo » remonte
 * la moitié du catalogue et la liste clignote à chaque frappe.
 */
export const MIN_QUERY_LENGTH = 3;

/**
 * Un panneau de suggestions se parcourt d'un coup d'œil : au-delà il faut le
 * faire défiler, et autant utiliser les filtres.
 */
export const MAX_RESULTS = 6;

/* ───────────────────────────── Comparaison ───────────────────────────── */

/**
 * Version comparable d'un caractère : minuscule et sans accent. Les données de
 * l'API sont en anglais mais pas les noms d'artistes — Dalí, Cézanne, Munch — et
 * sans ce repli, taper « dali » ne trouve rien.
 *
 * Le garde-fou sur la longueur est ce qui rend le surlignage possible : la
 * décomposition Unicode peut changer le nombre de caractères (le « İ » turc
 * devient deux caractères en minuscule). À longueur inégale on rend le caractère
 * d'origine, ce qui garantit qu'un indice trouvé dans le texte réduit est
 * valable dans le texte affiché. Voir `splitOnMatch`.
 */
function foldChar(char: string): string {
  const folded = char
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  return folded.length === char.length ? folded : char;
}

/** Version comparable d'un texte. Même longueur que l'original — voir `foldChar`. */
export function fold(text: string): string {
  return Array.from(text, foldChar).join("");
}

/* ───────────────────────────── Recherche ───────────────────────────── */

/**
 * Œuvres dont le titre ou l'artiste contient la requête.
 *
 * Deux champs et pas plus : c'est ce qu'un visiteur a en tête. Chercher aussi
 * dans la description remonterait des œuvres sans rapport visible avec ce qui
 * est tapé, et la liste paraîtrait aléatoire.
 *
 * Le seuil est appliqué ici et non dans l'interface, pour qu'aucun appel ne
 * puisse l'oublier.
 */
export function searchArtworks(
  artworks: ArtworkPreview[],
  query: string,
): ArtworkPreview[] {
  const needle = fold(query.trim());
  if (needle.length < MIN_QUERY_LENGTH) return [];

  return artworks.filter(
    (artwork) =>
      fold(artwork.title).includes(needle) ||
      (artwork.artist !== null && fold(artwork.artist).includes(needle)),
  );
}

/* ───────────────────────────── Surlignage ───────────────────────────── */

export interface TextChunk {
  text: string;
  /** Vrai si ce morceau est une occurrence de la requête. */
  match: boolean;
  /** Position dans le texte d'origine. Sert de clé React stable. */
  start: number;
}

/**
 * Découpe un texte en morceaux, en marquant les occurrences de la requête.
 *
 *     splitOnMatch("Claude Monet", "mon")
 *     → [{ text: "Claude ", match: false }, { text: "Mon", match: true },
 *        { text: "et", match: false }]
 *
 * Pas de `split(regex)` comme dans l'exemple du cours : une expression
 * construite depuis une saisie casse au premier caractère spécial — « ( » lève
 * une exception, « . » correspond à tout. L'échapper ne réglerait de toute façon
 * pas les accents. Un `indexOf` en boucle sur le texte réduit n'a ni l'un ni
 * l'autre défaut.
 */
export function splitOnMatch(text: string, query: string): TextChunk[] {
  const needle = fold(query.trim());
  if (needle.length === 0) return [{ text, match: false, start: 0 }];

  const haystack = fold(text);
  const chunks: TextChunk[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const found = haystack.indexOf(needle, cursor);
    if (found === -1) break;

    if (found > cursor) {
      chunks.push({
        text: text.slice(cursor, found),
        match: false,
        start: cursor,
      });
    }
    chunks.push({
      text: text.slice(found, found + needle.length),
      match: true,
      start: found,
    });
    cursor = found + needle.length;
  }

  if (cursor < text.length) {
    chunks.push({ text: text.slice(cursor), match: false, start: cursor });
  }

  return chunks;
}
