"use client";

import { useEffect, useMemo } from "react";
import { ArtworkBrowser } from "@/components/artwork/ArtworkBrowser";
import { Button } from "@/components/ui/Button";
import { useFavoritesStore } from "@/lib/store";
import type { ArtworkPreview } from "@/types/artwork";

interface FavoritesBrowserProps {
  /**
   * Le catalogue entier, pas seulement les œuvres mises de côté : les favoris ne
   * sont que des slugs en base, les œuvres vivent dans l'API. Le croisement se
   * fait ici.
   */
  artworks: ArtworkPreview[];
  /**
   * Les favoris lus en base par la page. Ils amorcent le cache plutôt que de le
   * remplacer : sans eux, un espace personnel commencerait par annoncer « vous
   * n'avez aucun favori » à quelqu'un qui en a.
   */
  initialSlugs: string[];
}

/**
 * La page des favoris, qui est la page Collection avec un autre contenu.
 *
 * Filtres, compteur, grille, état vide de filtrage : tout vient
 * d'`ArtworkBrowser`, à qui l'on passe une liste plus courte. Une correction
 * faite sur la collection les corrige donc tous les deux.
 *
 * L'ordre vient des slugs et non du catalogue : la requête les renvoie du plus
 * récemment ajouté au plus ancien, et c'est cet ordre qui a du sens ici. Filtrer
 * le catalogue aurait rendu l'ordre de l'API, c'est-à-dire aucun.
 */
export function FavoritesBrowser({
  artworks,
  initialSlugs,
}: FavoritesBrowserProps) {
  /**
   * On n'écrit pas dans le store pendant le rendu, et ce n'était pas une
   * maladresse de style : un composant client est aussi rendu sur le serveur, où
   * le store Zustand est un objet de MODULE partagé par toutes les requêtes.
   *
   *   1. le visiteur A charge la page → le store du serveur retient ses slugs ;
   *   2. le visiteur B charge la page → l'amorçage est sauté et son HTML part
   *      avec les favoris de A ;
   *   3. dans son navigateur, la grille change sous ses yeux après coup.
   *
   * Le décalage visible n'était que la partie émergée : la page d'un visiteur
   * pouvait afficher la collection d'un autre.
   *
   * `storeSlugs ?? initialSlugs` : le serveur et le premier rendu affichent ce
   * que la page a lu en base, puis c'est le cache qu'on lit — retirer une œuvre
   * la fait disparaître sans rechargement.
   */
  const storeSlugs = useFavoritesStore((state) => state.slugs);
  const slugs = storeSlugs ?? initialSlugs;

  /* L'amorçage dans un effet : il ne s'exécute que dans le navigateur, où le
     store appartient à un seul visiteur. Il ne remplit que si le cache est encore
     inconnu, sans quoi il écraserait un retrait fait sur une autre page. */
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
        /* Une œuvre retirée du catalogue par l'API laisse une ligne sans
           correspondance : elle disparaît sans casser la page. */
        .filter((artwork): artwork is ArtworkPreview => artwork !== undefined),
    [slugs, bySlug],
  );

  return (
    <ArtworkBrowser
      artworks={favorites}
      /* Sans ce préfixe, cliquer une œuvre d'ici menait à `/collection/...`,
         dont le lien de retour ramène au catalogue du musée : on perdait sa
         place à chaque œuvre consultée. */
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
