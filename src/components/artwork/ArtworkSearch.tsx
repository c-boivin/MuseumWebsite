"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Highlight } from "@/components/ui/Highlight";
import { Media } from "@/components/ui/Media";
import { MAX_RESULTS, MIN_QUERY_LENGTH, searchArtworks } from "@/lib/search";
import type { ArtworkPreview } from "@/types/artwork";

gsap.registerPlugin(useGSAP);

interface ArtworkSearchProps {
  /** Catalogue complet : la recherche se fait sur place, sans rappeler l'API. */
  artworks: ArtworkPreview[];
}

/**
 * Recherche d'œuvre par titre ou par artiste, avec panneau de suggestions.
 *
 * ── POURQUOI UN useState ICI, ALORS QUE LES FILTRES VIVENT DANS L'URL ──
 * La contradiction n'est qu'apparente, et la distinction vaut d'être comprise :
 * un filtre coché est un état qu'on veut PARTAGER (le lien envoyé doit montrer
 * la même sélection), une saisie de recherche est un état TRANSITOIRE — on tape
 * trois lettres, on clique sur une suggestion, et la saisie n'a plus de raison
 * d'exister. La mettre dans l'URL empilerait une entrée d'historique par frappe :
 * le bouton Précédent deviendrait « effacer une lettre ». L'URL sert à ce qui
 * doit survivre à la page, `useState` à ce qui meurt avec elle.
 *
 * ── CE QUE LA RECHERCHE NE FAIT PAS ──
 * Elle ne filtre pas la grille : elle mène directement à une fiche. Les deux
 * gestes sont différents — on filtre pour EXPLORER, on cherche parce qu'on sait
 * déjà ce qu'on veut. Mélanger les deux ferait bouger la grille pendant qu'on
 * lit les suggestions.
 *
 * ── LE RÔLE DE `onComplete` ──
 * Les résultats sont vidés à la FIN de l'animation de fermeture, pas au moment
 * où on décide de fermer. Sans ça, effacer une lettre viderait la liste
 * instantanément et on regarderait un panneau vide s'effacer pendant trois
 * dixièmes de seconde.
 */
export function ArtworkSearch({ artworks }: ArtworkSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArtworkPreview[]>([]);
  const [isSearchResultsVisible, setIsSearchResultsVisible] = useState(false);

  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const inputId = useId();

  function handleChange(value: string) {
    setQuery(value);

    /* Les résultats ne sont mis à jour QUE si la requête est assez longue.
       En dessous du seuil, on garde volontairement la liste précédente : c'est
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

      /* GSAP écrit des styles en ligne, image par image : le garde-fou
         `prefers-reduced-motion` de globals.css, qui ne touche qu'aux animations
         CSS, ne l'atteint pas. On annule donc la durée nous-mêmes — le panneau
         apparaît d'un coup, et `onComplete` se déclenche quand même. */
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      /* `autoAlpha` = opacité + visibility. La seconde partie compte autant que
         la première : un panneau à `opacity: 0` resterait cliquable et ses liens
         accessibles à la tabulation, ce qui piège la navigation au clavier.

         `overwrite: true` tue l'animation en cours sur le même élément — et une
         animation tuée ne déclenche pas son `onComplete`. C'est ce qui évite que
         la fermeture d'il y a une demi-seconde vienne vider les résultats d'une
         ouverture toute neuve, quand on tape vite.

         `y` en rem et non en px : tout le site est dimensionné en rem fluide
         (voir globals.css), une valeur en px ne suivrait pas l'échelle. */
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
    /* Se rejoue à chaque changement d'état d'ouverture. Au tout premier rendu,
       c'est la branche de fermeture qui s'exécute : invisible pour
       l'utilisateur, elle pose la position de départ dont la première ouverture
       aura besoin pour glisser. */
    { dependencies: [isSearchResultsVisible] },
  );

  const visible = results.slice(0, MAX_RESULTS);
  const hidden = results.length - visible.length;

  return (
    /* biome-ignore lint/a11y/noStaticElementInteractions: le conteneur ne porte
       aucun rôle interactif — il n'écoute que pour REFERMER le panneau, et les
       deux gestes concernés (Échap, sortie du focus) sont déjà accessibles au
       clavier par nature. */
    <div
      className="relative"
      /* Ferme dès que le focus quitte l'ensemble champ + panneau : c'est ce qui
         gère à la fois le clic ailleurs dans la page et la tabulation vers la
         suite. Le test sur `relatedTarget` est indispensable, sinon passer du
         champ à une suggestion — donc rester à l'intérieur — refermerait le
         panneau avant même le clic. */
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
        /* Revenir dans un champ déjà rempli doit rouvrir les suggestions :
           autrement, l'utilisateur qui reprend sa recherche voit un champ qui
           semble ne plus rien proposer. */
        onFocus={() => {
          if (query.trim().length >= MIN_QUERY_LENGTH) {
            setIsSearchResultsVisible(true);
          }
        }}
        placeholder="Rechercher…"
        /* Le navigateur proposerait ses propres saisies passées par-dessus notre
           panneau, qui tenterait de le recouvrir. */
        autoComplete="off"
        /* `appearance-none` sur le bouton d'effacement natif : Chrome le dessine
           avec la couleur d'accent du système — bleu sous Windows — et cette
           couleur n'est pas stylable proprement. On le masque pour poser la
           nôtre juste en dessous, qui suit les tokens du site.

           `pr-9` réserve la place de ce bouton : sans lui, un titre un peu long
           passerait dessous. */
        className="w-full border border-line bg-surface py-2 pr-9 pl-3 text-sm placeholder:text-ink-mute focus:border-ink [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none"
      />

      {/* Affiché seulement quand il y a quelque chose à effacer : un bouton qui
          ne fait rien est pire que pas de bouton.

          Le focus revient au champ après l'effacement — sinon il resterait sur
          un bouton qui vient de disparaître, et la tabulation repartirait du
          début de la page. */}
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
          {/* SVG plutôt qu'un caractère « ✕ » : le dessin ne dépend alors pas de
              la police, et `currentColor` le fait suivre la couleur du texte. */}
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

      {/* Le nombre de résultats change sans rechargement et le panneau est
          purement visuel : sans cette annonce, un utilisateur de lecteur d'écran
          taperait dans le vide. */}
      <p aria-live="polite" className="sr-only">
        {isSearchResultsVisible
          ? results.length === 0
            ? "Aucune œuvre trouvée"
            : `${results.length} œuvre${results.length > 1 ? "s" : ""} trouvée${results.length > 1 ? "s" : ""}`
          : ""}
      </p>

      {/* `invisible opacity-0` en classes et non via GSAP : l'état de départ doit
          exister dès le HTML servi par le serveur, sinon le panneau apparaîtrait
          le temps que le JavaScript s'exécute.

          Le panneau déborde un peu sur la grille : à 14rem — la largeur de la
          colonne de filtres — un titre d'œuvre ne tient pas. 20rem suffisent,
          les titres trop longs étant de toute façon coupés par `truncate` : plus
          large, le panneau masquait une carte entière de la grille.

          `z-30` le place au-dessus de la grille, et sous le header (`z-50`) qui
          reste collé en haut. */}
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
                    href={`/collection/${artwork.slug}`}
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
                    {/* `min-w-0` : sans lui, un élément de flex refuse de
                        rétrécir sous la largeur de son contenu, et `truncate`
                        n'a aucun effet — le titre déborderait du panneau. */}
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
