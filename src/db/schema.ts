import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

/**
 * Le schéma de la base, vu par le reste du projet.
 *
 * Deux fichiers et non un seul parce qu'ils n'ont pas le même propriétaire :
 * `auth-schema.ts` est réécrit par la CLI de Better Auth à chaque régénération.
 * Tout ranger ensemble ferait écraser nos tables métier par le premier
 * `pnpm db:auth`. Il est aussi exclu de Biome (voir `biome.json`) : le linter
 * réordonnait ses imports, que la régénération suivante défaisait.
 *
 * Le ré-export fait que tout le monde n'importe qu'un seul endroit.
 *
 * Après modification : `pnpm db:push` seul quand on touche à une table de CE
 * fichier ; `pnpm db:auth` puis `pnpm db:push` seulement quand on ajoute à
 * `lib/auth.ts` un plugin qui réclame ses propres tables.
 */
export * from "./auth-schema";

/**
 * Les œuvres qu'un visiteur a mises de côté.
 *
 * Une ligne par couple (compte, œuvre) et non une colonne « liste de slugs » :
 * une liste oblige à relire, modifier et réécrire l'ensemble pour un seul ajout,
 * donc deux onglets ouverts et le second écrase le premier.
 *
 * La clé primaire est le couple, il n'y a pas d'`id` : c'est la base qui rend
 * impossible d'aimer deux fois la même œuvre, là où un `if` dépendrait de
 * l'ordre d'arrivée de deux clics. Les tables de Better Auth portent un `id`
 * parce que la librairie l'exige, ce n'est pas un modèle à recopier.
 *
 * Aucun index supplémentaire : Postgres en crée un sur la clé primaire, donc sur
 * `(user_id, artwork_slug)`, dont une recherche par `user_id` seul se sert déjà.
 * Un second index ne servirait à rien et ralentirait chaque écriture.
 *
 * `artworkSlug` n'est pas une clé étrangère — les œuvres viennent de l'API. Rien
 * ne garantit donc qu'un favori existe toujours : la page croise ses slugs avec
 * le catalogue, une ligne orpheline disparaît de l'affichage sans erreur. Elle
 * reste en base, et c'est assumé : la supprimer voudrait dire effacer les
 * favoris d'un visiteur sur la foi d'une API momentanément incomplète.
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
    /* Ordre d'affichage : sans elle, la page des favoris dépendrait de l'ordre
       que Postgres choisit, qui n'est garanti par rien. */
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.artworkSlug] })],
);
