import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { favorite } from "@/db/schema";

/**
 * Les requêtes de la table `favorite`. SEUL fichier qui la connaît — même règle
 * que `lib/museum.ts` pour l'API du musée et `db/index.ts` pour la connexion.
 *
 * ── IL NE LIT JAMAIS LA SESSION ──
 * Chaque fonction reçoit l'`userId` en paramètre au lieu d'aller le chercher.
 * C'est ce qui rend la règle d'accès visible à l'œil : un appelant qui oublie
 * d'où vient son identifiant ne compile pas. Si ces fonctions lisaient la
 * session elles-mêmes, il faudrait lire leur corps pour savoir de quel compte
 * elles parlent — et une future tâche de fond, qui n'a pas de session, ne
 * pourrait plus les appeler.
 *
 * ── CE FICHIER N'EST PAS UNE FRONTIÈRE CLIENT ──
 * Il touche la base : il ne doit JAMAIS être importé par un composant client.
 * Ce sont les Server Actions de `lib/favorites-actions.ts` qui font le pont, et
 * elles sont la seule porte d'entrée du navigateur.
 */

/**
 * Forme d'un slug d'œuvre : des mots en minuscules reliés par des tirets.
 *
 * VÉRIFIÉ PARCE QUE LA VALEUR VIENT DU NAVIGATEUR — d'un appel de bouton, ou du
 * paramètre d'URL que porte un visiteur qui se connecte pour mettre une œuvre de
 * côté. Elle est écrite telle quelle dans la base, et rien dans le schéma ne la
 * contraint : le slug n'est pas une clé étrangère, les œuvres n'étant pas dans
 * cette base (voir `db/schema.ts`). Sans ce filtre, un appel fabriqué à la main
 * pourrait remplir la table de chaînes arbitraires.
 *
 * Ce n'est PAS une vérification d'existence : confirmer qu'une œuvre existe
 * demanderait un appel à l'API du musée à chaque clic, pour un gain nul — une
 * œuvre inconnue n'apparaîtra simplement jamais à l'écran.
 *
 * Il vit ici, avec les requêtes, et non dans un fichier d'actions : les deux
 * fichiers `"use server"` en ont besoin, et un module `"use server"` ne doit
 * exporter que des fonctions asynchrones exposées au client.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isArtworkSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

/**
 * Les slugs mis de côté par un compte, du plus récent au plus ancien.
 *
 * DES SLUGS ET NON DES ŒUVRES : la base ne contient aucune œuvre, elles vivent
 * dans l'API du musée. C'est l'appelant qui croise cette liste avec le
 * catalogue — voir la page `/compte`.
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
 * Combien d'œuvres ce compte a-t-il mises de côté ?
 *
 * ON COMPTE EN BASE plutôt que de rapatrier les slugs pour en mesurer la
 * longueur : c'est Postgres qui sait le faire, et l'accroche de « Mon profil »
 * n'a besoin que du nombre. Même raisonnement que `isFavorite` juste en
 * dessous — la page des favoris, elle, a bien besoin de la liste entière et
 * appelle `getFavoriteSlugs`.
 */
export async function countFavorites(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(favorite)
    .where(eq(favorite.userId, userId));

  return row?.total ?? 0;
}

/**
 * Cette œuvre est-elle dans la collection de ce compte ?
 *
 * UNE REQUÊTE CIBLÉE plutôt qu'un `getFavoriteSlugs(...).includes(...)` : la
 * fiche `/compte/collection/[slug]` n'a besoin de savoir que pour UNE œuvre, et
 * rapatrier toute la liste pour en lire une ligne grossit avec la collection du
 * visiteur — c'est le genre de détail qui ne se voit pas à trois favoris et se
 * paie à trois cents.
 *
 * `limit(1)` parce que la clé primaire garantit déjà l'unicité du couple : on
 * ne cherche pas combien il y en a, seulement s'il y en a.
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
 * Met une œuvre de côté. Ne fait rien si elle y est déjà.
 *
 * `onConflictDoNothing` PLUTÔT QU'UN `SELECT` PUIS UN `INSERT` : entre les deux
 * requêtes, un second clic — ou un second onglet — a le temps d'insérer la même
 * ligne, et l'insertion échoue alors sur la clé primaire. Une seule requête qui
 * dit à la base quoi faire du conflit ferme la fenêtre au lieu de parier qu'elle
 * ne s'ouvrira pas.
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
