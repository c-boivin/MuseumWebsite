import type { ArtworkPreview } from "@/types/artwork";

/**
 * Recherche texte dans le catalogue.
 *
 * Tout est ici plutôt que dans le composant pour une raison simple : ce sont des
 * fonctions PURES (une entrée, une sortie, aucun état). Elles se relisent, se
 * testent et se réutilisent seules, là où la même logique noyée dans un
 * `onChange` ne sert qu'une fois.
 */

/**
 * Longueur minimale d'une requête avant d'afficher quoi que ce soit.
 *
 * En dessous, la recherche n'a aucun pouvoir de discrimination : « mo » remonte
 * la moitié du catalogue, ce qui donne une liste inutile qui clignote à chaque
 * frappe. Trois caractères, c'est le seuil à partir duquel une saisie désigne
 * réellement quelque chose.
 */
export const MIN_QUERY_LENGTH = 3;

/**
 * Nombre de suggestions affichées au maximum.
 *
 * Un panneau de suggestions se parcourt d'un coup d'œil : au-delà, il faut le
 * faire défiler, et autant alors utiliser les filtres. La troncature est
 * annoncée à l'utilisateur quand elle se produit.
 */
export const MAX_RESULTS = 6;

/* ───────────────────────────── Comparaison ───────────────────────────── */

/**
 * Version comparable d'un caractère : minuscule et sans accent.
 *
 * POURQUOI RETIRER LES ACCENTS : les données de l'API sont en anglais, mais les
 * noms d'artistes ne le sont pas — Salvador Dalí, Paul Cézanne, Edvard Munch.
 * Sans ce repli, taper « dali » au clavier ne trouve rien, et l'utilisateur en
 * conclut que l'œuvre n'existe pas.
 *
 * LE GARDE-FOU SUR LA LONGUEUR est ce qui rend le surlignage possible : la
 * décomposition Unicode peut changer le nombre de caractères (le « İ » turc
 * devient deux caractères en minuscule). Si la substitution ne garde pas la même
 * longueur, on renonce et on rend le caractère d'origine — le texte réduit fait
 * alors exactement la taille du texte d'origine, et une position trouvée dans
 * l'un est valable dans l'autre. C'est ce qui permet à `splitOnMatch` de
 * découper le texte AFFICHÉ, accents compris, à partir d'indices calculés sur sa
 * version réduite.
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
 * Deux champs et pas plus : c'est ce qu'un visiteur a en tête quand il cherche
 * (« la Joconde », « un Monet »). Chercher aussi dans la description
 * remonterait des œuvres sans rapport visible avec ce qui est tapé, et la liste
 * paraîtrait aléatoire.
 *
 * Renvoie un tableau vide sous `MIN_QUERY_LENGTH` : le seuil est appliqué ici,
 * pas dans l'interface, pour qu'aucun appel ne puisse l'oublier.
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
 * POURQUOI PAS UN `split(regex)` comme dans l'exemple du cours : construire une
 * expression régulière à partir d'une saisie utilisateur casse dès qu'on tape un
 * caractère spécial — « ( » suffit à lever une exception, « . » fait
 * correspondre n'importe quoi. Il faudrait l'échapper, et l'échappement ne
 * réglerait toujours pas les accents. Un `indexOf` en boucle sur le texte réduit
 * n'a ni l'un ni l'autre défaut, et rend au passage la position exacte de chaque
 * occurrence.
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
