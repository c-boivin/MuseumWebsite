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
   * Phrase du compteur quand aucun filtre ne retire d'œuvre : « 39 œuvres
   * exposées » dans la collection, « 12 œuvres dans vos favoris » dans l'espace
   * compte.
   *
   * UNE CHAÎNE DÉJÀ COMPOSÉE, ET NON UNE FONCTION `(n) => string`. Ce composant
   * est appelé depuis des Server Components : une fonction ne franchit pas la
   * frontière serveur/client, le rendu échouerait — et il échouerait chez le
   * prochain appelant, pas ici. Le nombre est de toute façon connu de l'appelant,
   * puisque c'est lui qui fournit la liste.
   */
  totalLabel?: string;
  /**
   * Ce qu'on affiche quand la liste reçue est vide AVANT tout filtrage — un
   * espace favoris encore vide, par exemple.
   *
   * À ne pas confondre avec « aucune œuvre ne correspond à cette sélection »,
   * plus bas : celui-là parle des filtres, celui-ci de la liste elle-même. Les
   * confondre afficherait une colonne de filtres à quelqu'un qui n'a rien à
   * filtrer, et lui suggérerait que c'est sa sélection qui ne va pas.
   */
  emptyState?: React.ReactNode;
  /**
   * Préfixe des liens vers les fiches d'œuvres.
   *
   * `/collection` dans le catalogue du musée, `/compte/collection` dans celle du
   * visiteur : la fiche existe sous les deux parcours et le lien doit rester dans
   * celui qu'on suit, sans quoi le retour ramène dans le mauvais. Voir
   * `app/compte/collection/[slug]/page.tsx`.
   */
  basePath?: string;
}

/** Noms des paramètres d'URL. Centralisés : ils apparaissent à plusieurs endroits. */
const PARAM = { century: "siecle", hue: "teinte" } as const;

/**
 * Cases du filtre « teinte ».
 *
 * Hors du composant parce que la liste ne dépend d'aucune prop : elle est figée
 * par `lib/facets.ts`. La recalculer à chaque rendu ne servirait à rien.
 */
const HUE_OPTIONS: CheckboxOption[] = HUES.map((hue) => ({
  value: hue.value,
  label: hue.label,
  swatch: hue.swatch,
}));

/**
 * Lit un paramètre multi-valeur : `?teinte=bleu,vert` → `["bleu", "vert"]`.
 *
 * Le format « valeurs séparées par des virgules » est retenu plutôt que la
 * répétition du paramètre (`?teinte=bleu&teinte=vert`) parce qu'il donne une URL
 * nettement plus courte à partager, et que `URLSearchParams` gère les deux.
 */
function readList(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  return raw ? raw.split(",").filter(Boolean) : [];
}

/**
 * Page Collection : les filtres et la grille qu'ils pilotent.
 *
 * ── POURQUOI L'ÉTAT VIT DANS L'URL ET NON DANS UN useState ──
 * Une sélection de filtres est un état que l'utilisateur veut pouvoir partager,
 * mettre en favori, et retrouver avec le bouton Précédent. Dans un `useState`,
 * elle disparaît au rechargement et le lien envoyé à quelqu'un ne montre pas la
 * même chose. L'URL est le seul endroit qui donne ces trois comportements sans
 * une ligne de code en plus.
 *
 * ── POURQUOI LE FILTRAGE EST CÔTÉ CLIENT ──
 * Les 39 œuvres sont déjà dans la page : filtrer sur place est instantané et ne
 * coûte aucune requête. Filtrer côté serveur rendrait la page dynamique et lui
 * ferait perdre sa génération statique, pour un résultat identique à l'écran.
 *
 * ── LA CONTREPARTIE, ASSUMÉE ──
 * La page étant statique, le HTML servi contient les 39 œuvres. En ouvrant un
 * lien déjà filtré, on les voit donc toutes pendant l'instant qui précède
 * l'hydratation. C'est le prix du statique ; l'alternative serait de lire
 * `searchParams` côté serveur et de perdre le SSG.
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
   * Coche ou décoche une valeur, et réécrit l'URL.
   *
   * Le code du cours faisait `params.set(key, value)`, qui remplace la valeur
   * précédente — donc un seul choix à la fois. Ici on manipule une LISTE, ce qui
   * est la vraie différence entre des boutons de sélection et des cases à cocher.
   *
   * `delete` quand la liste se vide, sinon l'URL se traîne un `?teinte=` inutile.
   */
  function toggle(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    const current = readList(params, key);
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];

    if (next.length > 0) params.set(key, next.join(","));
    else params.delete(key);

    const query = params.toString();

    /* `scroll: false` : sans ça, chaque case cochée renverrait l'utilisateur en
       haut de page, alors que les filtres sont juste à côté de la grille. */
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const filtered = useMemo(
    () => artworks.filter((artwork) => matchesFilters(artwork, filters)),
    [artworks, filters],
  );

  /**
   * Siècles proposés : ceux réellement présents dans le catalogue.
   *
   * Dérivés des données plutôt qu'écrits en dur — si l'API gagne une œuvre du
   * XXIe siècle, la case apparaît sans qu'on touche à ce fichier.
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

  /* APRÈS TOUS LES HOOKS, jamais avant : `useMemo` et consorts doivent être
     appelés dans le même ordre à chaque rendu. Une liste qui passe de vide à
     remplie — les favoris qui arrivent — changerait sinon le nombre de hooks
     entre deux rendus, et React s'arrête là-dessus. */
  if (artworks.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div className="mt-16 grid grid-cols-[14rem_1fr] items-start gap-12">
      {/* `sticky` : la colonne de filtres reste accessible pendant qu'on fait
          défiler une longue grille.

          L'offset part de --spacing-header, la hauteur du header collant : à
          `top-8`, la colonne se calait plus haut que lui et ses premières lignes
          disparaissaient dessous au scroll. Le calcul garde les deux liés, et
          les 1.5rem ajoutent la respiration qu'avait `top-8`.

          `max-h` + `overflow-y-auto` : sans eux, une liste de filtres plus haute
          que l'écran aurait son bas définitivement hors d'atteinte, puisque la
          colonne ne défile plus avec la page. */}
      {/* `z-40` sur la colonne ELLE-MÊME, et pas seulement sur le panneau de
          suggestions : `position: sticky` crée un contexte d'empilement, donc le
          `z-30` du panneau ne le compare qu'à ses frères À L'INTÉRIEUR de
          l'aside. Face à la grille, c'est l'aside entier qui est jugé — et sans
          z-index, il perdait, puisque la grille vient après lui dans le DOM. 40
          reste sous le header collant (`z-50`). */}
      <aside className="sticky top-[calc(var(--spacing-header)+1.5rem)] z-40 space-y-10">
        <ArtworkSearch artworks={artworks} basePath={basePath} />

        {/* Le défilement est sur les FILTRES, pas sur toute la colonne : le
            panneau de suggestions est en position absolue, et un ancêtre en
            `overflow-y-auto` le rognerait net dès qu'il dépasse la colonne.
            La recherche reste donc en dehors de la zone qui défile — ce qui la
            garde aussi visible en permanence, alors qu'elle est le raccourci le
            plus rapide vers une œuvre. */}
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
        {/* `aria-live` : le nombre de résultats change sans rechargement de page.
            Sans cette annonce, un utilisateur de lecteur d'écran cocherait une
            case sans jamais savoir ce que ça a produit. */}
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
