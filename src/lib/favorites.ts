import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { favorite } from "@/db/schema";

/**
 * Les requêtes de la table `favorite`. Seul fichier qui la connaît, même règle
 * que `lib/museum.ts` pour l'API.
 *
 * Il ne lit jamais la session : chaque fonction reçoit l'`userId` en paramètre,
 * ce qui rend la règle d'accès visible à l'appel et laisse la porte ouverte à
 * une tâche de fond, qui n'a pas de session.
 *
 * Il touche la base : jamais importé par un composant client. Ce sont les Server
 * Actions de `lib/favorites-actions.ts` qui font le pont.
 */

/**
 * Forme d'un slug d'œuvre. Vérifié parce que la valeur vient du navigateur et
 * qu'elle est écrite telle quelle en base : le slug n'est pas une clé étrangère,
 * les œuvres n'étant pas dans cette base. Sans ce filtre, un appel fabriqué à la
 * main pourrait remplir la table de chaînes arbitraires.
 *
 * Ce n'est pas une vérification d'existence : elle demanderait un appel à l'API
 * à chaque clic, pour un gain nul — une œuvre inconnue n'apparaîtra jamais.
 *
 * Ici et non dans un fichier d'actions : les deux modules `"use server"` en ont
 * besoin, et un module `"use server"` ne doit exporter que des fonctions async.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isArtworkSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

/**
 * Les slugs mis de côté, du plus récent au plus ancien. Des slugs et non des
 * œuvres : la base n'en contient aucune, c'est l'appelant qui croise cette liste
 * avec le catalogue.
 */
export async function getFavoriteSlugs(userId: string): Promise<string[]> {
  const rows = await db
    .select({ artworkSlug: favorite.artworkSlug })
    .from(favorite)
    .where(eq(favorite.userId, userId))
    .orderBy(desc(favorite.createdAt));

  return rows.map((row) => row.artworkSlug);
}

/**
 * Compté en base plutôt qu'en rapatriant les slugs pour en mesurer la longueur :
 * l'accroche de « Mon profil » n'a besoin que du nombre.
 */
export async function countFavorites(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(favorite)
    .where(eq(favorite.userId, userId));

  return row?.total ?? 0;
}

/**
 * Une requête ciblée plutôt qu'un `getFavoriteSlugs(...).includes(...)` :
 * rapatrier toute la liste pour en lire une ligne grossit avec la collection —
 * invisible à trois favoris, payant à trois cents.
 *
 * `limit(1)` : la clé primaire garantit déjà l'unicité du couple.
 */
export async function isFavorite(
  userId: string,
  artworkSlug: string,
): Promise<boolean> {
  const rows = await db
    .select({ artworkSlug: favorite.artworkSlug })
    .from(favorite)
    .where(
      and(eq(favorite.userId, userId), eq(favorite.artworkSlug, artworkSlug)),
    )
    .limit(1);

  return rows.length > 0;
}

/**
 * Met une œuvre de côté. `onConflictDoNothing` plutôt qu'un `SELECT` puis un
 * `INSERT` : entre les deux requêtes, un second clic a le temps d'insérer la
 * même ligne et l'insertion échoue sur la clé primaire.
 */
export async function addFavorite(userId: string, artworkSlug: string) {
  await db
    .insert(favorite)
    .values({ userId, artworkSlug })
    .onConflictDoNothing();
}

/** Retire une œuvre. Ne fait rien si elle n'y était pas. */
export async function removeFavorite(userId: string, artworkSlug: string) {
  await db
    .delete(favorite)
    .where(
      and(eq(favorite.userId, userId), eq(favorite.artworkSlug, artworkSlug)),
    );
}
