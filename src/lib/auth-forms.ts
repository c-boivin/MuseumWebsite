import { APIError } from "better-auth/api";
import type { AuthFormMessage } from "@/types/auth";

/**
 * La plomberie commune aux formulaires de compte : lire un champ, traduire un
 * refus de Better Auth.
 *
 * `auth-actions.ts` (entrer) et `account-actions.ts` (gérer son compte) ont
 * besoin des mêmes trois fonctions, et deux copies de la règle « le mot de passe
 * se lit brut » finissent par diverger — avec, à la clé, un compte auquel son
 * propriétaire n'accède plus. Voir `readRaw`.
 *
 * Pas un fichier `"use server"` : il n'exporte aucune action, et un module
 * `"use server"` publierait ces utilitaires comme points d'entrée réseau.
 */

/**
 * Traduction des refus de Better Auth.
 *
 * On traduit les messages d'erreur et pas les données de l'API du musée : un
 * titre d'œuvre est un nom propre, un message d'erreur est une consigne.
 *
 * On s'accroche au code et non au texte : le code est une constante de la
 * librairie, le texte peut changer d'une version à l'autre et la traduction
 * raterait alors en silence.
 *
 * Codes relevés sur la version installée (1.7.5) en interrogeant l'API, pas
 * recopiés d'une documentation — deux n'étaient pas ceux attendus :
 * `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` et non `USER_ALREADY_EXISTS`,
 * `VALIDATION_ERROR` et non `INVALID_EMAIL`. À revérifier après une montée de
 * version : c'est le seul endroit du projet dont la justesse dépend de
 * constantes d'une librairie tierce.
 */
const MESSAGES: Record<string, string> = {
  /* ── Entrer ── */
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Un compte existe déjà avec cette adresse e-mail.",
  /* Code des versions antérieures, gardé en plus : il ne coûte rien. */
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cette adresse e-mail.",
  /* Couvre les deux cas volontairement : l'affiner en « cette adresse est
     inconnue » dirait à n'importe qui si une adresse a un compte chez nous. */
  INVALID_EMAIL_OR_PASSWORD: "Adresse e-mail ou mot de passe incorrect.",
  PASSWORD_TOO_SHORT: "Le mot de passe doit faire au moins 8 caractères.",
  PASSWORD_TOO_LONG: "Ce mot de passe est trop long.",
  /* Presque inatteignable : le navigateur bloque déjà sur `type="email"` et
     `required`. Utile le jour où un champ sera ajouté sans contrainte HTML. */
  VALIDATION_ERROR:
    "Une des informations saisies n'est pas valide. Vérifiez votre adresse e-mail.",

  /* ── Gérer son compte — ceux-là supposent une session ouverte ── */

  /* Distinct de `INVALID_EMAIL_OR_PASSWORD` : ici l'identité est déjà établie,
     il n'y a aucune existence de compte à dissimuler. */
  INVALID_PASSWORD: "Mot de passe incorrect.",
  /* Inatteignable aujourd'hui, le site n'a que l'inscription par e-mail. */
  CREDENTIAL_ACCOUNT_NOT_FOUND:
    "Ce compte n'a pas de mot de passe : il a été créé par un autre moyen de connexion.",
  SESSION_EXPIRED:
    "Votre session a expiré. Reconnectez-vous, puis recommencez.",
  CHANGE_EMAIL_DISABLED:
    "Le changement d'adresse e-mail n'est pas disponible pour le moment.",
  EMAIL_CAN_NOT_BE_UPDATED: "Cette adresse e-mail ne peut pas être utilisée.",
};

/**
 * Deux familles qui ne se traitent pas pareil : un `APIError` est un refus — la
 * librairie a compris et dit non, il y a quelque chose d'utile à dire. Tout le
 * reste est une panne, dont le détail ne concerne pas le visiteur.
 */
export function toMessage(error: unknown): AuthFormMessage {
  if (error instanceof APIError) {
    const code = error.body?.code;
    return {
      tone: "error",
      message:
        (code && MESSAGES[code]) ??
        "La demande n'a pas pu aboutir. Vérifiez les informations saisies et réessayez.",
    };
  }

  /* La trace serveur doit exister : sans elle, une panne de base ressemble à un
     mauvais mot de passe. */
  console.error("[auth]", error);
  return {
    tone: "error",
    message: "Le service est momentanément indisponible. Réessayez plus tard.",
  };
}

/** Lecture d'un champ texte. L'espace autour d'une adresse ne compte pas. */
export function readTrimmed(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Le mot de passe est lu brut : un espace en début ou en fin en fait partie. Le
 * rogner à l'inscription et pas à la connexion fabrique un compte auquel son
 * propriétaire n'accède plus.
 *
 * C'est la règle qui justifie à elle seule l'existence de ce fichier : rien ne
 * la rappelle sur le lieu de l'appel.
 */
export function readRaw(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
