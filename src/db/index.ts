import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * La connexion à la base Neon. Seul fichier du projet qui la connaît.
 *
 * Deux paquets et non un : Drizzle ne parle pas à Postgres, il traduit du
 * TypeScript typé en SQL, et c'est le driver Neon qui l'exécute — d'où cette
 * composition, où l'on branche un exécuteur dans un traducteur.
 *
 * `neon-http` et non `neon-serverless` : le premier envoie chaque requête en un
 * appel HTTP sans garder de connexion ouverte, ce qui est le régime d'un rendu
 * serverless. Le second ouvre un WebSocket, utile pour les transactions à
 * plusieurs requêtes, dont Better Auth n'a pas besoin.
 *
 * La variable est vérifiée ici plutôt que laissée à `!` : l'oubli de
 * `DATABASE_URL` est l'erreur la plus probable de cette mise en place, et sans ce
 * garde-fou le driver échoue plus loin sur un message d'URL malformée.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL est absente. Renseignez la chaîne de connexion POOLED de Neon dans .env.local, et reportez-la dans les variables d'environnement Vercel en production.",
  );
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
