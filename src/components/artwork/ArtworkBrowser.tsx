"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ArtworkGrid } from "@/components/artwork/ArtworkGrid";
import { ArtworkSearch } from "@/components/artwork/ArtworkSearch";
import {
  CheckboxGroup,
  type CheckboxOption,
} from "@/components/ui/CheckboxGroup";
import {
  type ArtworkFilters,
  centuryLabel,
  centuryOf,
  HUES,
  matchesFilters,
} from "@/lib/facets";
import type { ArtworkPreview } from "@/types/artwork";

interface ArtworkBrowserProps {
  /** Catalogue complet. Le filtrage se fait ici, sans rappeler l'API. */
  artworks: ArtworkPreview[];
  /**
   * Phrase du compteur quand aucun filtre ne retire d'œuvre.
   *
   * Une chaîne déjà composée et non une fonction `(n) => string` : ce composant
   * est appelé depuis des Server Components, et une fonction ne franchit pas la
   * frontière serveur/client.
   */
  totalLabel?: string;
  /**
   * Ce qu'on affiche quand la liste est vide AVANT tout filtrage. À ne pas
   * confondre avec « aucune œuvre ne correspond à cette sélection » : afficher
   * une colonne de filtres à quelqu'un qui n'a rien à filtrer lui suggérerait
   * que c'est sa sélection qui ne va pas.
   */
  emptyState?: React.ReactNode;
  /**
   * `/collection` dans le catalogue du musée, `/compte/collection` dans celle du
   * visiteur : la fiche existe sous les deux parcours et le lien doit rester
   * dans celui qu'on suit.
   */
  basePath?: string;
}

/** Noms des paramètres d'URL, centralisés : ils servent à plusieurs endroits. */
const PARAM = { century: "siecle", hue: "teinte" } as const;

/** Hors du composant : la liste ne dépend d'aucune prop, elle est figée par `lib/facets.ts`. */
const HUE_OPTIONS: CheckboxOption[] = HUES.map((hue) => ({
  value: hue.value,
  label: hue.label,
  swatch: hue.swatch,
}));

/**
 * Lit un paramètre multi-valeur : `?teinte=bleu,vert` → `["bleu", "vert"]`.
 *
 * Les virgules plutôt que la répétition du paramètre : l'URL partagée est
 * nettement plus courte, et `URLSearchParams` gère les deux.
 */
function readList(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  return raw ? raw.split(",").filter(Boolean) : [];
}

/**
 * Page Collection : les filtres et la grille qu'ils pilotent.
 *
 * L'état vit dans l'URL et non dans un `useState` : une sélection de filtres se
 * partage, se met en favori et se retrouve avec le bouton Précédent, trois
 * comportements que l'URL donne sans une ligne de code.
 *
 * Le filtrage est côté client parce que les 39 œuvres sont déjà dans la page :
 * filtrer côté serveur rendrait la page dynamique et lui ferait perdre sa
 * génération statique, pour le même résultat.
 *
 * Contrepartie assumée : le HTML servi contient les 39 œuvres, donc en ouvrant
 * un lien déjà filtré on les voit toutes le temps de l'hydratation.
 */
export function ArtworkBrowser({
  artworks,
  totalLabel,
  emptyState,
  basePath,
}: ArtworkBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: ArtworkFilters = useMemo(
    () => ({
      centuries: readList(searchParams, PARAM.century),
      hues: readList(searchParams, PARAM.hue),
    }),
    [searchParams],
  );

  /**
   * Le code du cours faisait `params.set(key, value)`, qui remplace la valeur
   * précédente donc n'autorise qu'un choix : ici on manipule une liste, c'est la
   * différence entre des boutons de sélection et des cases à cocher.
   */
  function toggle(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    const current = readList(params, key);
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];

    /* `delete` quand la liste se vide, sinon l'URL traîne un `?teinte=` inutile. */
    if (next.length > 0) params.set(key, next.join(","));
    else params.delete(key);

    const query = params.toString();

    /* `scroll: false` : sans ça, chaque case cochée renverrait en haut de page,
       alors que les filtres sont juste à côté de la grille. */
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const filtered = useMemo(
    () => artworks.filter((artwork) => matchesFilters(artwork, filters)),
    [artworks, filters],
  );

  /**
   * Siècles réellement présents dans le catalogue, dérivés des données plutôt
   * qu'écrits en dur : une œuvre du XXIe siècle ferait apparaître la case sans
   * qu'on touche à ce fichier.
   */
  const centuryOptions = useMemo<CheckboxOption[]>(() => {
    const centuries = [
      ...new Set(
        artworks
          .map((artwork) => centuryOf(artwork.year))
          .filter((century): century is number => century !== null),
      ),
    ].sort((a, b) => a - b);

    return centuries.map((century) => ({
      value: String(century),
      label: centuryLabel(century),
    }));
  }, [artworks]);

  /* Après tous les hooks, jamais avant : une liste qui passe de vide à remplie
     changerait le nombre de hooks entre deux rendus. */
  if (artworks.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div className="mt-16 grid grid-cols-[14rem_1fr] items-start gap-12">
      {/* L'offset part de --spacing-header : à `top-8`, la colonne se calait plus
          haut que le header collant et ses premières lignes disparaissaient
          dessous. `max-h` + `overflow-y-auto` : sans eux, une liste plus haute
          que l'écran aurait son bas hors d'atteinte, la colonne ne défilant plus.

          `z-40` sur la colonne elle-même : `position: sticky` crée un contexte
          d'empilement, le `z-30` du panneau de suggestions ne le compare donc
          qu'à ses frères dans l'aside. Face à la grille, c'est l'aside entier
          qui est jugé. 40 reste sous le header (`z-50`). */}
      <aside className="sticky top-[calc(var(--spacing-header)+1.5rem)] z-40 space-y-10">
        <ArtworkSearch artworks={artworks} basePath={basePath} />

        {/* Le défilement porte sur les filtres et non sur toute la colonne : le
            panneau de suggestions est en position absolue, un ancêtre en
            `overflow-y-auto` le rognerait dès qu'il dépasse. */}
        <div className="max-h-[calc(100vh-var(--spacing-header)-8rem)] space-y-10 overflow-y-auto scrollbar-none">
          <CheckboxGroup
            legend="Siècle"
            options={centuryOptions}
            selected={filters.centuries}
            onToggle={(value) => toggle(PARAM.century, value)}
          />

          <CheckboxGroup
            legend="Teinte dominante"
            options={HUE_OPTIONS}
            selected={filters.hues}
            onToggle={(value) => toggle(PARAM.hue, value)}
            layout="swatches"
          />
        </div>
      </aside>

      <div>
        {/* `aria-live` : le nombre change sans rechargement, sans cette annonce
            un lecteur d'écran cocherait une case sans savoir ce qu'elle produit. */}
        <p aria-live="polite" className="text-ink-mute text-sm">
          {filtered.length === artworks.length
            ? (totalLabel ?? `${artworks.length} œuvres exposées`)
            : `${filtered.length} œuvre${filtered.length > 1 ? "s" : ""} sur ${artworks.length}`}
        </p>

        {filtered.length > 0 ? (
          <ArtworkGrid
            artworks={filtered}
            basePath={basePath}
            className="mt-8"
          />
        ) : (
          <div className="mt-8 border-line border-t pt-8">
            <p className="text-ink-soft">
              Aucune œuvre ne correspond à cette sélection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
