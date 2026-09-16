import type { ArtworkPreview } from "@/types/artwork";

/**
 * Critères de filtrage de la collection.
 *
 * Aucun des deux n'existe tel quel dans l'API : ce sont des valeurs DÉRIVÉES.
 * Les regrouper ici, en fonctions pures, permet de les réutiliser partout — la
 * grille pour filtrer, les cases à cocher pour compter — sans dupliquer la règle.
 */

/* ───────────────────────────── Siècle ───────────────────────────── */

/**
 * Siècle d'une œuvre à partir de son année.
 *
 * `(année - 1) / 100 + 1` et non `année / 100 + 1` : l'an 1500 appartient au XVe
 * siècle, pas au XVIe. Le catalogue ne contient aucune année pile en fin de
 * siècle, donc les deux formules y donnent le même résultat — autant écrire la
 * juste, elle ne coûte rien.
 */
export function centuryOf(year: number | null): number | null {
  return year === null ? null : Math.floor((year - 1) / 100) + 1;
}

const ROMAN: Record<number, string> = {
  15: "XVe",
  16: "XVIe",
  17: "XVIIe",
  18: "XVIIIe",
  19: "XIXe",
  20: "XXe",
  21: "XXIe",
};

/**
 * « XIXe », sans le mot « siècle ».
 *
 * Exporté à part parce que tous les affichages ne veulent pas la phrase
 * complète : les chiffres clés de l'accueil annoncent une fourchette
 * — « XVe — XXe » — où répéter « siècle » deux fois serait illisible.
 * Repli sur « 22e » pour un siècle hors de la table.
 */
export function centuryRoman(century: number): string {
  return ROMAN[century] ?? `${century}e`;
}

/** « XIXe siècle ». */
export function centuryLabel(century: number): string {
  return `${centuryRoman(century)} siècle`;
}

/* ───────────────────────────── Teinte ───────────────────────────── */

/**
 * Teintes reconnues dans le champ `color` de l'API.
 *
 * POURQUOI DES MOTS-CLÉS plutôt que la valeur brute : `color` est un texte libre,
 * et les 39 œuvres ont 39 valeurs toutes différentes (« Bleu cobalt profond »,
 * « Ocre doré et brun sfumato »). Filtrer dessus tel quel donnerait 39 cases à
 * cocher menant chacune à une seule œuvre. En cherchant des mots de couleur, on
 * obtient 7 familles exploitables.
 *
 * Conséquence intéressante : une œuvre porte souvent DEUX teintes — 27 sur 39.
 * Le filtre est donc multi-valeur des deux côtés, ce qui justifie les cases à
 * cocher plutôt qu'un choix unique.
 *
 * L'ordre de la liste est celui d'affichage, choisi pour suivre le cercle
 * chromatique plutôt que la fréquence.
 *
 * `swatch` pointe un token de `globals.css` plutôt qu'une valeur en dur : la
 * règle du projet veut qu'aucune couleur ne s'écrive dans un composant, et ça
 * permet de retoucher la palette des filtres au même endroit que le reste.
 * `label` reste indispensable même si l'interface n'affiche que la pastille —
 * c'est lui que lit un lecteur d'écran.
 */
export const HUES = [
  {
    value: "bleu",
    label: "Bleu",
    pattern: /bleu|azur|outremer|indigo/i,
    swatch: "var(--color-hue-bleu)",
  },
  {
    value: "vert",
    label: "Vert",
    pattern: /vert|émeraude|olive/i,
    swatch: "var(--color-hue-vert)",
  },
  {
    value: "jaune",
    label: "Jaune et or",
    pattern: /jaune|doré|dorée|\bor\b|ocre/i,
    swatch: "var(--color-hue-jaune)",
  },
  {
    value: "rouge",
    label: "Rouge",
    pattern: /rouge|carmin|pourpre|vermillon/i,
    swatch: "var(--color-hue-rouge)",
  },
  {
    value: "rose",
    label: "Rose",
    pattern: /rose|chair/i,
    swatch: "var(--color-hue-rose)",
  },
  {
    value: "brun",
    label: "Brun",
    pattern: /brun|sépia|terre|sfumato/i,
    swatch: "var(--color-hue-brun)",
  },
  {
    value: "gris",
    label: "Gris et noir",
    pattern: /gris|argent|noir|blanc/i,
    swatch: "var(--color-hue-gris)",
  },
] as const;

export type HueValue = (typeof HUES)[number]["value"];

/** Teintes portées par une œuvre. Tableau vide si la couleur est absente. */
export function huesOf(color: string | null): HueValue[] {
  if (!color) return [];
  return HUES.filter((hue) => hue.pattern.test(color)).map((hue) => hue.value);
}

/* ─────────────────────────── Filtrage ─────────────────────────── */

export interface ArtworkFilters {
  /** Siècles retenus, en texte parce qu'ils viennent de l'URL. Vide = tous. */
  centuries: string[];
  /** Teintes retenues. Vide = toutes. */
  hues: string[];
}

/**
 * Une œuvre passe-t-elle les filtres ?
 *
 * Deux règles, et elles ne sont pas les mêmes :
 * - ENTRE deux critères, c'est un ET : une œuvre du XIXe **et** bleue.
 * - À L'INTÉRIEUR d'un critère, c'est un OU : cocher bleu et vert montre les
 *   œuvres bleues **ou** vertes. Cocher deux cases doit élargir le résultat,
 *   sinon l'utilisateur a l'impression que l'interface est cassée.
 *
 * Un critère sans aucune case cochée ne filtre rien.
 */
export function matchesFilters(
  artwork: ArtworkPreview,
  filters: ArtworkFilters,
): boolean {
  const century = centuryOf(artwork.year);
  const byCentury =
    filters.centuries.length === 0 ||
    (century !== null && filters.centuries.includes(String(century)));

  const byHue =
    filters.hues.length === 0 ||
    huesOf(artwork.color).some((hue) => filters.hues.includes(hue));

  return byCentury && byHue;
}
