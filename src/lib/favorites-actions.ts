"use server";

import {
  addFavorite,
  getFavoriteSlugs,
  isArtworkSlug,
  removeFavorite,
} from "@/lib/favorites";
import { getCurrentUser } from "@/lib/session";

/**
 * La seule porte par laquelle le navigateur touche aux favoris.
 *
 * `lib/favorites.ts` reçoit un `userId` en paramètre ; ici on le lit dans la
 * session et jamais dans les arguments. C'est toute la sécurité du dispositif :
 * un identifiant qui traverse le réseau est un identifiant que n'importe qui
 * peut remplacer depuis les outils de développement.
 */

/**
 * Les favoris du visiteur connecté, appelée une fois par chargement depuis
 * `account/FavoritesSync`. Renvoie une liste vide et non une erreur quand
 * personne n'est connecté : c'est la réponse juste.
 */
export async function listFavoritesAction(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  return getFavoriteSlugs(user.id);
}

/**
 * Met une œuvre de côté, ou l'en retire.
 *
 * On passe l'état voulu et non une bascule, et la différence compte dès le
 * deuxième clic : deux appels partis coup sur coup s'annuleraient et laisseraient
 * l'œuvre dans l'état inverse de ce que le visiteur voit. En annonçant l'état
 * voulu, le second appel confirme le premier.
 *
 * Elle ne lève pas, elle répond : une exception traverserait la frontière
 * serveur en message anonymisé, dont le bouton ne peut rien faire.
 */
export async function setFavoriteAction(
  artworkSlug: string,
  favorited: boolean,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  if (!isArtworkSlug(artworkSlug)) return { ok: false };

  try {
    if (favorited) await addFavorite(user.id, artworkSlug);
    else await removeFavorite(user.id, artworkSlug);
  } catch (error) {
    /* Sans trace serveur, une panne de base ressemble à un bouton qui ne réagit
       pas. */
    console.error("[favorites]", error);
    return { ok: false };
  }

  /* Pas de `revalidatePath` : la page des favoris est dynamique, et c'est le
     cache client qui la fait réagir — voir `account/FavoritesBrowser`. */
  return { ok: true };
}
