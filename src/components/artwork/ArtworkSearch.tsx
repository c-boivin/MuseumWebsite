"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useId, useRef, useState } from "react";
import { TransitionLink as Link } from "@/components/motion/TransitionLink";
import { Highlight } from "@/components/ui/Highlight";
import { Media } from "@/components/ui/Media";
import { MAX_RESULTS, MIN_QUERY_LENGTH, searchArtworks } from "@/lib/search";
import type { ArtworkPreview } from "@/types/artwork";

gsap.registerPlugin(useGSAP);

interface ArtworkSearchProps {
  /** Catalogue complet : la recherche se fait sur place, sans rappeler l'API. */
  artworks: ArtworkPreview[];
  /**
   * `/collection` dans le catalogue du musée, `/compte/collection` dans celle du
   * visiteur : le lien doit rester dans le parcours qu'on suit.
   */
  basePath?: string;
}

/**
 * Recherche d'œuvre par titre ou par artiste, avec panneau de suggestions.
 *
 * Un `useState` alors que les filtres vivent dans l'URL, et la distinction vaut
 * d'être comprise : un filtre coché est un état qu'on veut partager, une saisie
 * est transitoire. La mettre dans l'URL empilerait une entrée d'historique par
 * frappe, et le bouton Précédent deviendrait « effacer une lettre ».
 *
 * Elle ne filtre pas la grille, elle mène directement à une fiche : on filtre
 * pour explorer, on cherche parce qu'on sait déjà ce qu'on veut.
 *
 * Les résultats sont vidés à la fin de l'animation de fermeture et non au moment
 * où on ferme : sinon on regarderait un panneau vide s'effacer.
 */
export function ArtworkSearch({
  artworks,
  basePath = "/collection",
}: ArtworkSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArtworkPreview[]>([]);
  const [isSearchResultsVisible, setIsSearchResultsVisible] = useState(false);

  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const inputId = useId();

  function handleChange(value: string) {
    setQuery(value);

    /* En dessous du seuil, on garde volontairement la liste précédente : c'est
       elle qui reste affichée pendant la fermeture. */
    if (value.trim().length >= MIN_QUERY_LENGTH) {
      setResults(searchArtworks(artworks, value));
    }

    setIsSearchResultsVisible(value.trim().length >= MIN_QUERY_LENGTH);
  }

  useGSAP(
    () => {
      const el = panel.current;
      if (!el) return;

      /* GSAP écrit des styles en ligne : le garde-fou `prefers-reduced-motion`
         de globals.css ne l'atteint pas. On annule la durée nous-mêmes, et
         `onComplete` se déclenche quand même. */
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      /* `autoAlpha` = opacité + visibility, et la seconde partie compte autant :
         un panneau à `opacity: 0` resterait cliquable et accessible à la
         tabulation.

         `overwrite: true` tue l'animation en cours, et une animation tuée ne
         déclenche pas son `onComplete` — c'est ce qui évite qu'une fermeture
         vienne vider les résultats d'une ouverture toute neuve quand on tape
         vite.

         `y` en rem : tout le site est dimensionné en rem fluide. */
      if (isSearchResultsVisible) {
        gsap.to(el, {
          autoAlpha: 1,
          y: 0,
          duration: reduced ? 0 : 0.4,
          ease: "expo.out",
          overwrite: true,
        });
      } else {
        gsap.to(el, {
          autoAlpha: 0,
          y: "-0.5rem",
          duration: reduced ? 0 : 0.3,
          ease: "expo.out",
          overwrite: true,
          onComplete: () => setResults([]),
        });
      }
    },
    /* Au tout premier rendu c'est la branche de fermeture qui s'exécute :
       invisible, elle pose la position de départ de la première ouverture. */
    { dependencies: [isSearchResultsVisible] },
  );

  const visible = results.slice(0, MAX_RESULTS);
  const hidden = results.length - visible.length;

  return (
    /* biome-ignore lint/a11y/noStaticElementInteractions: le conteneur ne porte
       aucun rôle interactif — il n'écoute que pour refermer le panneau, et les
       deux gestes concernés sont déjà accessibles au clavier par nature. */
    <div
      className="relative"
      /* Ferme dès que le focus quitte l'ensemble champ + panneau, ce qui couvre
         le clic ailleurs et la tabulation. Le test sur `relatedTarget` est
         indispensable : sans lui, passer du champ à une suggestion refermerait
         le panneau avant le clic. */
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsSearchResultsVisible(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setIsSearchResultsVisible(false);
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Rechercher une œuvre ou un artiste
      </label>

      <input
        ref={input}
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => handleChange(event.target.value)}
        /* Revenir dans un champ déjà rempli doit rouvrir les suggestions, sinon
           le champ semble ne plus rien proposer. */
        onFocus={() => {
          if (query.trim().length >= MIN_QUERY_LENGTH) {
            setIsSearchResultsVisible(true);
          }
        }}
        placeholder="Rechercher…"
        /* Le navigateur proposerait ses propres saisies passées par-dessus notre
           panneau. */
        autoComplete="off"
        /* `appearance-none` sur le bouton d'effacement natif : Chrome le dessine
           avec la couleur d'accent du système, qui n'est pas stylable. On le
           masque pour poser la nôtre juste en dessous. `pr-9` réserve sa place. */
        className="w-full border border-line bg-surface py-2 pr-9 pl-3 text-sm placeholder:text-ink-mute focus:border-ink [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none"
      />

      {/* Affiché seulement quand il y a quelque chose à effacer. Le focus revient
          au champ, sinon il resterait sur un bouton disparu et la tabulation
          repartirait du début de la page. */}
      {query.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setIsSearchResultsVisible(false);
            input.current?.focus();
          }}
          aria-label="Effacer la recherche"
          className="-translate-y-1/2 absolute top-1/2 right-3 text-ink transition-opacity hover:opacity-60"
        >
          {/* SVG plutôt qu'un « ✕ » : le dessin ne dépend pas de la police, et
              `currentColor` le fait suivre la couleur du texte. */}
          <svg
            viewBox="0 0 10 10"
            aria-hidden="true"
            className="size-2.5 stroke-current"
            fill="none"
            strokeWidth="1.5"
          >
            <path d="M1 1 L9 9 M9 1 L1 9" />
          </svg>
        </button>
      )}

      {/* Le panneau est purement visuel : sans cette annonce, un utilisateur de
          lecteur d'écran taperait dans le vide. */}
      <p aria-live="polite" className="sr-only">
        {isSearchResultsVisible
          ? results.length === 0
            ? "Aucune œuvre trouvée"
            : `${results.length} œuvre${results.length > 1 ? "s" : ""} trouvée${results.length > 1 ? "s" : ""}`
          : ""}
      </p>

      {/* `invisible opacity-0` en classes et non via GSAP : l'état de départ doit
          exister dès le HTML servi.

          20rem : à 14rem — la largeur de la colonne de filtres — un titre ne
          tient pas ; plus large, le panneau masquait une carte entière. `z-30`
          le place au-dessus de la grille et sous le header (`z-50`). */}
      <div
        ref={panel}
        className="invisible absolute top-full left-0 z-30 mt-2 w-[20rem] border border-line bg-surface opacity-0 shadow-lg"
      >
        {visible.length > 0 ? (
          <>
            <ul>
              {visible.map((artwork) => (
                <li
                  key={artwork.slug}
                  className="border-line border-b last:border-b-0"
                >
                  <Link
                    href={`${basePath}/${artwork.slug}`}
                    transitionLabel={artwork.title}
                    className="flex items-center gap-4 p-3 transition-colors hover:bg-paper"
                  >
                    <Media
                      item={artwork.media}
                      ratio="square"
                      fit="cover"
                      position="top"
                      sizes="10vw"
                      className="w-12 shrink-0"
                    />
                    {/* `min-w-0` : sans lui, un élément flex refuse de rétrécir
                        sous la largeur de son contenu et `truncate` n'a aucun
                        effet. */}
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-sm">
                        <Highlight text={artwork.title} query={query} />
                      </span>
                      <span className="block truncate text-ink-soft text-sm">
                        <Highlight
                          text={artwork.artist ?? "Artiste inconnu"}
                          query={query}
                        />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {hidden > 0 && (
              <p className="border-line border-t px-3 py-2 text-ink-mute text-sm">
                et {hidden} autre{hidden > 1 ? "s" : ""} — précisez votre
                recherche
              </p>
            )}
          </>
        ) : (
          <p className="p-3 text-ink-soft text-sm">
            Aucune œuvre ne correspond à «&nbsp;{query.trim()}&nbsp;».
          </p>
        )}
      </div>
    </div>
  );
}
