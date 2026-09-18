"use client";

import { useEffect, useMemo } from "react";
import { ArtworkBrowser } from "@/components/artwork/ArtworkBrowser";
import { Button } from "@/components/ui/Button";
import { useFavoritesStore } from "@/lib/store";
import type { ArtworkPreview } from "@/types/artwork";

interface FavoritesBrowserProps {
  /**
   * Le catalogue ENTIER, pas seulement les œuvres mises de côté.
   *
   * Les favoris ne sont que des slugs en base — les œuvres, elles, vivent dans
   * l'API du musée. La page charge donc le catalogue comme le fait
   * `/collection`, et le croisement se fait ici.
   */
  artworks: ArtworkPreview[];
  /**
   * Les favoris lus en base par la page, au moment de son rendu serveur.
   *
   * ILS AMORCENT LE CACHE PLUTÔT QUE DE LE REMPLACER. Sans eux, la page
   * s'afficherait vide puis se remplirait une fois la requête du navigateur
   * revenue — un espace personnel qui commence par annoncer « vous n'avez aucun
   * favori » à quelqu'un qui en a. Avec eux, le premier HTML est déjà le bon.
   */
  initialSlugs: string[];
}

/**
 * La page des favoris, qui est la page Collection avec un autre contenu.
 *
 * ── ELLE NE REDESSINE RIEN ──
 * Filtres par siècle et par teinte, compteur, grille, état vide de filtrage :
 * tout vient d'`ArtworkBrowser`, à qui l'on passe une liste plus courte. Les
 * favoris héritent donc des filtres sans une ligne de plus, et une correction
 * faite sur la collection les corrige tous les deux. Recopier la grille aurait
 * garanti l'inverse.
 *
 * ── POURQUOI L'ORDRE VIENT DES SLUGS ET NON DU CATALOGUE ──
 * On parcourt les favoris et on va chercher l'œuvre, plutôt que de filtrer le
 * catalogue. Le résultat n'est pas le même : la requête renvoie les slugs du
 * plus récemment ajouté au plus ancien, et c'est cet ordre-là qui a du sens ici
 * — la dernière œuvre mise de côté est celle qu'on revient voir. Filtrer le
 * catalogue aurait rendu l'ordre de l'API, c'est-à-dire aucun ordre du point de
 * vue du visiteur.
 *
 * ── LE CACHE EST AMORCÉ PENDANT LE RENDU, PAS DANS UN EFFET ──
 * Un effet s'exécute après le premier affichage : la page montrerait son état
 * vide le temps d'une image. L'amorçage est donc fait au premier rendu, sous
 * garde — et il ne s'applique QUE si le cache est encore inconnu, pour ne pas
 * écraser un retrait fait juste avant sur une autre page.
 */
export function FavoritesBrowser({
  artworks,
  initialSlugs,
}: FavoritesBrowserProps) {
  /**
   * ── ON N'ÉCRIT PLUS DANS LE STORE PENDANT LE RENDU ──
   * C'est ainsi que l'amorçage était fait, et c'était un vrai défaut, pas une
   * maladresse de style. Un composant client est AUSSI rendu sur le serveur, et
   * le store Zustand y est un objet de MODULE, partagé par toutes les requêtes
   * du processus. Écrire dedans pendant le rendu, c'est donc laisser les favoris
   * d'un visiteur dans la mémoire du serveur :
   *
   *   1. Le visiteur A charge la page → le store du serveur retient ses slugs.
   *   2. Le visiteur B charge la page → le store n'est plus vide, l'amorçage est
   *      sauté, et le HTML de B part avec LES FAVORIS DE A.
   *   3. Dans le navigateur de B, le store repart vide, se remplit avec ses
   *      vrais favoris — et la grille change sous ses yeux après coup.
   *
   * Le décalage visible n'était donc que la partie émergée : le vrai problème
   * était que la page d'un visiteur pouvait afficher la collection d'un autre.
   *
   * ── LA PROP SERT DE VALEUR DE REPLI, LE CACHE PREND LE RELAIS ──
   * `storeSlugs ?? initialSlugs` : le serveur et le tout premier rendu client
   * affichent ce que la page a lu en base — donc le bon contenu, tout de suite et
   * sans décalage. Dès que le cache est rempli (juste après, par l'effet
   * ci-dessous), c'est LUI qu'on lit : retirer une œuvre depuis cette page la
   * fait disparaître de la grille sans rechargement, ce qu'une lecture figée de
   * la prop n'aurait pas permis.
   */
  const storeSlugs = useFavoritesStore((state) => state.slugs);
  const slugs = storeSlugs ?? initialSlugs;

  /* L'amorçage, dans un effet : il ne s'exécute que dans le navigateur, où le
     store appartient à un seul visiteur. Il ne remplit que si le cache est encore
     inconnu — sans quoi il écraserait un retrait fait juste avant sur une autre
     page. */
  useEffect(() => {
    if (useFavoritesStore.getState().slugs === null) {
      useFavoritesStore.setState({ slugs: initialSlugs });
    }
  }, [initialSlugs]);

  const bySlug = useMemo(
    () => new Map(artworks.map((artwork) => [artwork.slug, artwork])),
    [artworks],
  );

  const favorites = useMemo(
    () =>
      (slugs ?? [])
        .map((slug) => bySlug.get(slug))
        /* Une œuvre mise de côté puis retirée du catalogue par l'API laisse une
           ligne sans correspondance. Elle disparaît de l'affichage sans casser
           la page — voir le commentaire de `artworkSlug` dans `db/schema.ts`. */
        .filter((artwork): artwork is ArtworkPreview => artwork !== undefined),
    [slugs, bySlug],
  );

  return (
    <ArtworkBrowser
      artworks={favorites}
      /* TOUTE LA PAGE RESTE DANS L'ESPACE COMPTE : sans ce préfixe, cliquer sur
         une œuvre d'ici menait à `/collection/mona-lisa`, dont le lien de retour
         ramène au catalogue du musée — on perdait sa place à chaque œuvre
         consultée. Voir `app/compte/collection/[slug]/page.tsx`. */
      basePath="/compte/collection"
      totalLabel={`${favorites.length} œuvre${favorites.length > 1 ? "s" : ""} dans votre collection`}
      emptyState={
        <div className="mt-16 max-w-reading space-y-6 border-line border-t pt-10">
          <p className="text-ink-soft text-lead">
            Vous n&apos;avez encore mis aucune œuvre de côté. Le signet en haut
            de chaque reproduction l&apos;ajoute à cette page.
          </p>
          <Button href="/collection">Parcourir la collection</Button>
        </div>
      }
    />
  );
}
