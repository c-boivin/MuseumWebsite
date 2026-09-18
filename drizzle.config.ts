import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

/**
 * Configuration de drizzle-kit, la CLI qui applique le schéma à la base Neon.
 *
 * ELLE VIT À LA RACINE ET NON DANS `src/` : c'est un outil de développement,
 * pas du code du site. Next ne la compile jamais, elle n'est lue que par les
 * commandes `pnpm db:*`.
 *
 * LE `config()` DE DOTENV N'EST PAS DÉCORATIF. Next charge `.env.local` tout
 * seul, drizzle-kit non — il s'exécute hors du serveur Next, dans un simple
 * processus Node. Sans cette ligne, `process.env.DATABASE_URL` vaut `undefined`
 * et la CLI échoue en annonçant une URL de connexion manquante, ce qui envoie
 * chercher le problème du côté de Neon alors qu'il est ici.
 */
config({ path: ".env.local" });

/* Vérifiée ici plutôt que forcée par un `!` : c'est ce qui manque dans la
   quasi-totalité des échecs de `pnpm db:push`, et le message par défaut de la
   CLI envoie chercher le problème du côté de Neon, où il n'est pas. */
const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL est absente de .env.local — collez-y la chaîne de connexion POOLED de Neon (onglet Connect du projet).",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
