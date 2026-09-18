import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * La connexion à la base Neon. SEUL fichier du projet qui la connaît — même
 * règle que `lib/museum.ts` pour l'API du musée.
 *
 * DEUX PAQUETS ET NON UN. Drizzle ne parle pas à Postgres : il traduit du
 * TypeScript typé en SQL, et c'est le driver Neon (`@neondatabase/serverless`)
 * qui l'exécute. D'où la composition ci-dessous, qui surprend au premier coup
 * d'œil — on branche un exécuteur dans un traducteur.
 *
 * `neon-http` ET NON `neon-serverless` : le premier envoie chaque requête en un
 * appel HTTP sans garder de connexion ouverte, ce qui est exactement le régime
 * d'un rendu serverless où chaque requête vit dans un processus jetable. Le
 * second ouvre un WebSocket, utile seulement pour les transactions à plusieurs
 * requêtes — Better Auth n'en a pas besoin.
 *
 * LA VARIABLE EST VÉRIFIÉE ICI, ET NON LAISSÉE À `!`. L'oubli de
 * `DATABASE_URL` est l'erreur la plus probable de toute cette mise en place —
 * fichier `.env.local` absent d'un clone, variable pas reportée dans Vercel.
 * Sans ce garde-fou, le driver échoue plus loin sur un message qui parle
 * d'URL malformée, et l'on part chercher la panne du côté de Neon.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL est absente. Renseignez la chaîne de connexion POOLED de Neon dans .env.local, et reportez-la dans les variables d'environnement Vercel en production.",
  );
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
