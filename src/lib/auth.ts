import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * Configuration serveur de l'authentification. Le cœur du dispositif, et le
 * SEUL endroit qui décide de ce que le musée sait faire d'un compte.
 *
 * CE FICHIER EST AUSSI L'ENTRÉE DE LA CLI : `pnpm db:auth` le lit pour
 * régénérer `src/db/auth-schema.ts`. Ajouter ici un plugin qui a besoin de ses
 * propres tables (2FA, passkeys…) oblige donc à régénérer PUIS à pousser en
 * base. Changer le secret, l'URL ou les options ci-dessous ne touche aucune
 * table et ne demande rien.
 *
 * `provider: "pg"` décrit le DIALECTE SQL, pas l'hébergeur : Neon est du
 * Postgres, la valeur ne change pas si l'on déménage la base ailleurs.
 *
 * MOT DE PASSE ACTIVÉ, VÉRIFICATION D'E-MAIL NON. Better Auth impose 8
 * caractères minimum par défaut — c'est la règle annoncée sur le formulaire
 * d'inscription, on ne la redéclare donc pas ici. La vérification par e-mail et
 * la réinitialisation de mot de passe restent éteintes faute de service
 * d'envoi : les activer produirait des comptes impossibles à confirmer et un
 * lien de réinitialisation qui n'arrive jamais. Voir la page
 * `/mot-de-passe-oublie`, qui le dit à l'écran plutôt que de le faire croire.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),

  emailAndPassword: { enabled: true },

  /**
   * DEUX OPÉRATIONS ÉTEINTES PAR DÉFAUT, et il faut les allumer explicitement :
   * Better Auth refuse de changer une adresse ou de supprimer un compte tant
   * qu'on ne l'a pas demandé. Le refus est d'ailleurs muet côté client — la
   * suppression répond 404 — et l'explication ne sort que dans les journaux du
   * serveur (« Delete user is disabled. Enable it in the options »). Vérifié
   * dans `api/routes/update-user.mjs` de la 1.7.5.
   */
  user: {
    changeEmail: {
      enabled: true,
      /**
       * SANS CETTE LIGNE, PERSONNE NE PEUT CHANGER D'ADRESSE ICI. La librairie
       * veut confirmer la nouvelle adresse par e-mail ; on n'a pas de service
       * d'envoi, elle refuserait donc toutes les demandes. L'option autorise la
       * mise à jour directe, mais uniquement pour un compte dont l'adresse n'est
       * PAS vérifiée — ce qui est le cas de tous les nôtres, la vérification
       * étant elle-même éteinte faute du même service d'envoi.
       *
       * Le jour où les e-mails partent vraiment, c'est cette ligne qu'on retire
       * en premier : elle ne protège plus rien dès que la vérification existe.
       *
       * À CONNAÎTRE, PARCE QUE ÇA SE VOIT À L'ÉCRAN : si la nouvelle adresse
       * appartient déjà à quelqu'un, la librairie répond SUCCÈS sans rien
       * changer. Ce n'est pas un bug, c'est délibéré — répondre « cette adresse
       * est prise » dirait à n'importe qui si une adresse donnée a un compte
       * chez nous, exactement ce que le message de connexion évite déjà. La
       * page de paramètres en tient compte : elle réaffiche l'adresse réelle du
       * compte plutôt que d'affirmer que le changement a eu lieu.
       */
      updateEmailWithoutVerification: true,
    },
    deleteUser: { enabled: true },
  },

  /**
   * `nextCookies()` DOIT RESTER LE DERNIER de la liste : les plugins
   * s'enveloppent les uns les autres dans l'ordre, et celui-ci doit voir la
   * réponse finale pour y écrire le cookie de session.
   *
   * C'est lui qui rend possible tout le parcours côté serveur. Une Server
   * Action ne renvoie pas une réponse HTTP que l'on contrôle : sans ce plugin,
   * `auth.api.signInEmail()` créerait bien la session en base mais son cookie
   * ne serait jamais posé sur le navigateur — connexion réussie, visiteur
   * toujours déconnecté, et aucune erreur nulle part.
   */
  plugins: [nextCookies()],
});
