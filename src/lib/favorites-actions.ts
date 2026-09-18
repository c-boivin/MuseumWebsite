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
 * `lib/favorites.ts` parle à la base et reçoit un `userId` en paramètre ; ici,
 * on le LIT DANS LA SESSION et jamais dans les arguments. C'est toute la
 * sécurité du dispositif : un identifiant de compte qui traverse le réseau est
 * un identifiant que n'importe qui peut remplacer par un autre, et l'on
 * modifierait les favoris de quelqu'un d'autre en changeant un paramètre dans
 * les outils de développement.
 */

/**
 * Les favoris du visiteur connecté, appelée une fois par chargement de page
 * depuis `account/FavoritesSync`.
 *
 * Renvoie une liste VIDE et non une erreur quand personne n'est connecté : ce
 * n'est pas un échec, c'est la réponse juste — un visiteur sans compte n'a
 * aucun favori.
 */
export async function listFavoritesAction(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  return getFavoriteSlugs(user.id);
}

/**
 * Met une œuvre de côté, ou l'en retire.
 *
 * ── ON PASSE L'ÉTAT VOULU, PAS UNE BASCULE ──
 * `setFavorite(slug, true)` et non `toggleFavorite(slug)`, et la différence
 * compte dès le deuxième clic. Une bascule inverse ce qu'elle trouve : deux
 * appels partis coup sur coup — un double-clic, un renvoi après une coupure
 * réseau — s'annulent et laissent l'œuvre dans l'état inverse de ce que le
 * visiteur voit à l'écran. En annonçant l'état voulu, le second appel confirme
 * le premier au lieu de le défaire, et l'écran a toujours raison.
 *
 * ── ELLE NE LÈVE PAS, ELLE RÉPOND ──
 * Une base injoignable ou une session expirée renvoie `ok: false`, à charge pour
 * le bouton de remettre son affichage dans l'état d'avant le clic. Une exception
 * traverserait la frontière serveur en message anonymisé (« An error occurred in
 * the Server Components render »), c'est-à-dire en quelque chose dont le bouton
 * ne peut rien faire.
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
    /* Même raison que dans `auth-actions` : sans trace serveur, une panne de
       base ressemble à un bouton qui ne réagit pas. */
    console.error("[favorites]", error);
    return { ok: false };
  }

  /* Pas de `revalidatePath("/compte")` : la page des favoris est dynamique, elle
     est recalculée à chaque visite. Et tant qu'on y est, c'est le cache client
     (`useFavoritesStore`) qui la fait réagir — voir `account/FavoritesBrowser`. */
  return { ok: true };
}
