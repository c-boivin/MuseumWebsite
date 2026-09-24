import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { siteUrl } from "@/lib/site-url";

/**
 * Configuration serveur de l'authentification, et seul endroit qui décide de ce
 * que le musée sait faire d'un compte.
 *
 * C'est aussi l'entrée de la CLI : `pnpm db:auth` le lit pour régénérer
 * `src/db/auth-schema.ts`. Ajouter ici un plugin qui a besoin de ses propres
 * tables oblige donc à régénérer puis à pousser en base.
 *
 * `provider: "pg"` décrit le dialecte SQL, pas l'hébergeur : Neon est du
 * Postgres, la valeur ne change pas si l'on déménage la base.
 *
 * Mot de passe activé, vérification d'e-mail non : Better Auth impose déjà 8
 * caractères, on ne le redéclare pas. La vérification et la réinitialisation
 * restent éteintes faute de service d'envoi — les activer produirait des comptes
 * impossibles à confirmer. Voir `/mot-de-passe-oublie`, qui le dit à l'écran.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),

  emailAndPassword: { enabled: true },

  /**
   * Les origines autorisées à appeler `app/api/auth/[...all]` depuis un
   * navigateur. Better Auth compare l'en-tête `Origin` de toute requête autre
   * qu'un GET à cette liste et répond 403 sinon : c'est sa protection CSRF,
   * pas un réglage de confort.
   *
   * Par défaut la liste ne contient qu'une entrée, l'origine de
   * `BETTER_AUTH_URL`. Les formulaires n'en dépendent pas — ils passent par des
   * Server Actions qui appellent `auth.api.*` en mémoire, sans requête HTTP. La
   * déconnexion, si : elle part du navigateur. Que la variable posée dans Vercel
   * ne désigne pas exactement le domaine visité, et le POST `/sign-out` est
   * refusé. Le GET `/get-session` n'est pas contrôlé, lui, d'où une panne
   * asymétrique difficile à lire : le header sait encore qui vous êtes, mais ne
   * sait plus vous faire sortir.
   *
   * On ne s'en remet donc plus à cette seule variable. Le domaine du site est
   * déjà résolu une fois pour toutes dans `lib/site-url.ts`, et `VERCEL_URL`
   * couvre les déploiements de préversion, dont l'adresse change à chaque
   * push — `siteUrl` désigne toujours la production et ne les verrait pas.
   */
  trustedOrigins: [
    siteUrl,
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],

  /**
   * Better Auth refuse de changer une adresse ou de supprimer un compte tant
   * qu'on ne l'a pas demandé, et le refus est muet côté client — la suppression
   * répond 404, l'explication ne sort que dans les journaux du serveur.
   */
  user: {
    changeEmail: {
      enabled: true,
      /**
       * Sans cette ligne, personne ne peut changer d'adresse : la librairie veut
       * confirmer par e-mail et refuserait toutes les demandes. L'option
       * autorise la mise à jour directe, mais seulement pour un compte dont
       * l'adresse n'est pas vérifiée — le cas de tous les nôtres. C'est la
       * première ligne à retirer le jour où les e-mails partent vraiment.
       *
       * À connaître, parce que ça se voit à l'écran : si la nouvelle adresse
       * appartient déjà à quelqu'un, la librairie répond SUCCÈS sans rien
       * changer. C'est délibéré — répondre « cette adresse est prise » dirait à
       * n'importe qui si une adresse a un compte chez nous. La page de
       * paramètres en tient compte et réaffiche l'adresse réelle.
       */
      updateEmailWithoutVerification: true,
    },
    deleteUser: { enabled: true },
  },

  /**
   * `nextCookies()` doit rester le dernier : les plugins s'enveloppent dans
   * l'ordre, et celui-ci doit voir la réponse finale pour y écrire le cookie.
   *
   * Sans lui, `auth.api.signInEmail()` créerait la session en base mais son
   * cookie ne serait jamais posé : connexion réussie, visiteur toujours
   * déconnecté, aucune erreur nulle part.
   */
  plugins: [nextCookies()],
});
