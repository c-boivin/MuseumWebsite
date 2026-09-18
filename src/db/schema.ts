import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

/**
 * Le schéma de la base, vu par le reste du projet.
 *
 * DEUX FICHIERS ET NON UN SEUL, parce qu'ils n'ont pas le même propriétaire :
 * `auth-schema.ts` est réécrit par la CLI de Better Auth à chaque régénération,
 * celui-ci est à nous. Tout ranger ensemble reviendrait à faire écraser nos
 * tables métier par la première commande `pnpm db:auth`.
 *
 * `auth-schema.ts` EST AUSSI EXCLU DE BIOME (voir `files.includes` dans
 * `biome.json`) : le linter réordonnait ses imports, et la régénération
 * suivante défaisait la correction. On ne met pas en forme un fichier dont on
 * n'écrit pas une ligne.
 *
 * Le ré-export fait que tout le monde n'importe qu'un seul endroit —
 * `drizzle.config.ts`, l'adaptateur Drizzle de `lib/auth.ts` et les requêtes
 * métier pointent tous ici.
 *
 * QUELLE COMMANDE APRÈS UNE MODIFICATION : `pnpm db:push` seule quand on touche
 * à une table de CE fichier, comme la table des favoris ci-dessous.
 * `pnpm db:auth` PUIS `pnpm db:push` uniquement quand on ajoute à `lib/auth.ts`
 * un plugin Better Auth qui réclame ses propres tables.
 */
export * from "./auth-schema";

/**
 * Les œuvres qu'un visiteur a mises de côté.
 *
 * ── UNE LIGNE PAR COUPLE (compte, œuvre) ──
 * Et non une colonne « liste de slugs » sur `user`. Une liste rangée dans une
 * colonne oblige à relire, modifier et réécrire l'ensemble pour ajouter un seul
 * favori : deux onglets ouverts sur la collection, et le second écrase l'ajout
 * du premier. Une ligne par favori rend chaque ajout et chaque retrait
 * indépendants.
 *
 * ── LA CLÉ PRIMAIRE EST LE COUPLE, ET IL N'Y A PAS D'`id` ──
 * C'est la base elle-même qui rend impossible d'aimer deux fois la même œuvre,
 * plutôt qu'un `if` dans une Server Action — un `if` dépend de l'ordre
 * d'arrivée de deux clics, une contrainte non. Les tables de Better Auth, elles,
 * portent un `id` de substitution : c'est la librairie qui l'exige, ce n'est pas
 * un modèle à recopier.
 *
 * ── AUCUN INDEX SUPPLÉMENTAIRE, ET C'EST VOLONTAIRE ──
 * La seule question posée à cette table est « quels sont les favoris de ce
 * compte ? ». Postgres crée un index sur la clé primaire, donc sur
 * `(user_id, artwork_slug)` dans cet ordre : une recherche par `user_id` seul
 * s'en sert déjà, puisqu'il en est la première colonne. Un second index sur
 * `user_id` ne servirait à rien et ralentirait chaque écriture. C'est aussi
 * pourquoi `auth-schema.ts` en déclare, lui : ses clés primaires sont sur `id`,
 * pas sur `user_id`.
 *
 * ── `artworkSlug` N'EST PAS UNE CLÉ ÉTRANGÈRE ──
 * Les œuvres ne sont pas dans cette base : elles viennent de l'API du musée. On
 * garde donc leur identifiant public, le slug — celui-là même qui sert d'URL
 * (`/collection/starry-night`), déjà choisi comme identifiant par `lib/museum`.
 * Conséquence à connaître : rien ne garantit qu'une œuvre mise en favori existe
 * toujours. Si l'API en retire une, sa ligne survit sans correspondance. La page
 * des favoris croise ses slugs avec le catalogue qu'elle vient de charger, une
 * ligne orpheline disparaît donc de l'affichage sans provoquer d'erreur — mais
 * elle reste en base, et c'est assumé : la faire disparaître voudrait dire
 * supprimer les favoris d'un visiteur sur la foi d'une API momentanément
 * incomplète.
 */
export const favorite = pgTable(
  "favorite",
  {
    userId: text("user_id")
      .notNull()
      /* `cascade` : supprimer son compte supprime ses favoris. C'est la promesse
         du bouton de suppression, et la laisser au code applicatif voudrait dire
         qu'un oubli la trahit en silence. */
      .references(() => user.id, { onDelete: "cascade" }),
    artworkSlug: text("artwork_slug").notNull(),
    /* Sert à l'ordre d'affichage : les derniers ajouts en tête. Sans elle, la
       page des favoris dépendrait de l'ordre que Postgres choisit, qui n'est
       garanti par rien. */
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.artworkSlug] })],
);
