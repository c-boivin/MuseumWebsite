import type { ArtworkPreview } from "@/types/artwork";

/**
 * Critères de filtrage de la collection.
 *
 * Aucun des deux n'existe tel quel dans l'API : ce sont des valeurs dérivées.
 * Des fonctions pures, réutilisées par la grille pour filtrer et par les cases à
 * cocher pour compter.
 */

/* ───────────────────────────── Siècle ───────────────────────────── */

/**
 * `(année - 1) / 100 + 1` et non `année / 100 + 1` : l'an 1500 appartient au
 * XVe siècle. Le catalogue n'a aucune année pile en fin de siècle, les deux
 * formules y donnent le même résultat — autant écrire la juste.
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
 * « XIXe », sans le mot « siècle » : les chiffres clés de l'accueil annoncent
 * une fourchette — « XVe — XXe » — où le répéter serait illisible.
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
 * Des mots-clés plutôt que la valeur brute : `color` est un texte libre et les
 * 39 œuvres ont 39 valeurs différentes (« Bleu cobalt profond »). Filtrer dessus
 * tel quel donnerait 39 cases menant chacune à une seule œuvre ; en cherchant
 * des mots de couleur on obtient 7 familles.
 *
 * Une œuvre porte souvent deux teintes — 27 sur 39 — ce qui justifie les cases à
 * cocher plutôt qu'un choix unique. L'ordre suit le cercle chromatique.
 *
 * `swatch` pointe un token de `globals.css` : aucune couleur ne s'écrit dans un
 * composant. `label` reste indispensable même si l'interface n'affiche que la
 * pastille, c'est lui que lit un lecteur d'écran.
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
 * Deux règles qui ne sont pas les mêmes : entre deux critères c'est un ET, à
 * l'intérieur d'un critère un OU. Cocher deux cases doit élargir le résultat,
 * sinon l'interface paraît cassée. Un critère sans case cochée ne filtre rien.
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
