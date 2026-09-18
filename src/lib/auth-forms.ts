import { APIError } from "better-auth/api";
import type { AuthFormMessage } from "@/types/auth";

/**
 * La plomberie commune aux formulaires de compte : lire un champ, traduire un
 * refus de Better Auth.
 *
 * ── POURQUOI CE FICHIER EXISTE ──
 * Les Server Actions de compte sont réparties en deux fichiers selon le moment
 * du parcours — `auth-actions.ts` pour ENTRER (inscription, connexion, mot de
 * passe oublié), `account-actions.ts` pour GÉRER son compte une fois dedans. Les
 * deux ont besoin des mêmes trois fonctions, et deux copies de la règle « le mot
 * de passe se lit brut » finissent toujours par diverger — avec, à la clé, un
 * compte auquel son propriétaire n'accède plus. Voir `readRaw`.
 *
 * ── CE N'EST PAS UN FICHIER `"use server"` ──
 * Il n'exporte aucune action, seulement des utilitaires appelés PAR des
 * actions. Un fichier `"use server"` ne doit exporter que des fonctions
 * asynchrones exposées au client : y mettre ces trois-là les publierait comme
 * points d'entrée réseau, ce qu'elles ne sont pas.
 */

/**
 * Traduction des refus de Better Auth, qui parle anglais.
 *
 * ON TRADUIT CEUX-LÀ ET PAS LES DONNÉES DE L'API DU MUSÉE, et ce n'est pas
 * contradictoire : un titre d'œuvre est un nom propre, un message d'erreur est
 * une consigne. Une consigne qu'on ne comprend pas est une consigne qu'on ne
 * peut pas suivre.
 *
 * On s'accroche au CODE et non au texte du message : le code est une constante
 * de la librairie, le texte peut changer d'une version à l'autre sans
 * prévenir — et la traduction se mettrait alors à rater en silence.
 *
 * CES CODES ONT ÉTÉ RELEVÉS SUR LA LIBRAIRIE INSTALLÉE (1.7.5), en interrogeant
 * l'API avec chaque cas d'erreur et en lisant `api/routes/update-user.mjs`, non
 * recopiés d'une documentation. Deux d'entre eux n'étaient pas ceux qu'on
 * attendait : l'e-mail déjà pris répond `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`
 * et non `USER_ALREADY_EXISTS`, une adresse malformée répond `VALIDATION_ERROR`
 * et non `INVALID_EMAIL`. Dans les deux cas la traduction tombait dans le
 * message générique — sans jamais lever d'erreur, donc sans rien signaler.
 *
 * À REVÉRIFIER APRÈS UNE MONTÉE DE VERSION de Better Auth, de la même façon :
 * c'est le seul endroit du projet dont la justesse dépend de constantes d'une
 * librairie tierce.
 */
const MESSAGES: Record<string, string> = {
  /* ── Entrer ── */
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Un compte existe déjà avec cette adresse e-mail.",
  /* Gardé en plus du précédent : c'est le code des versions antérieures, et il
     ne coûte rien de couvrir les deux. */
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cette adresse e-mail.",
  /**
   * `INVALID_EMAIL_OR_PASSWORD` COUVRE LES DEUX CAS VOLONTAIREMENT, et il ne
   * faut surtout pas l'affiner en « cette adresse est inconnue » : ce serait
   * dire à n'importe qui si une adresse donnée a un compte chez nous. Le
   * message flou est le message juste.
   */
  INVALID_EMAIL_OR_PASSWORD: "Adresse e-mail ou mot de passe incorrect.",
  PASSWORD_TOO_SHORT: "Le mot de passe doit faire au moins 8 caractères.",
  PASSWORD_TOO_LONG: "Ce mot de passe est trop long.",
  /* Une saisie refusée par la validation de la librairie. En pratique presque
     inatteignable : le navigateur bloque déjà l'envoi sur le `type="email"` et
     le `required` des champs, et `SubmitButton` reste éteint tant que le
     formulaire est invalide. Le message reste utile pour le jour où un champ
     sera ajouté sans contrainte HTML équivalente. */
  VALIDATION_ERROR:
    "Une des informations saisies n'est pas valide. Vérifiez votre adresse e-mail.",

  /* ── Gérer son compte ──
     Ceux-là ne peuvent pas survenir sur les pages d'entrée : ils supposent une
     session ouverte. */

  /* Le mot de passe actuel, demandé pour changer de mot de passe ou pour
     supprimer le compte. Distinct de `INVALID_EMAIL_OR_PASSWORD` : ici
     l'identité est déjà établie, il n'y a aucune existence de compte à
     dissimuler, et « mot de passe incorrect » est enfin le message exact. */
  INVALID_PASSWORD: "Mot de passe incorrect.",
  /* Un compte créé par un fournisseur externe, donc sans mot de passe à
     vérifier. Inatteignable aujourd'hui — le site n'a que l'inscription par
     e-mail — mais le message existe avant le premier bouton « Continuer avec
     Google », pas après. */
  CREDENTIAL_ACCOUNT_NOT_FOUND:
    "Ce compte n'a pas de mot de passe : il a été créé par un autre moyen de connexion.",
  SESSION_EXPIRED:
    "Votre session a expiré. Reconnectez-vous, puis recommencez.",
  CHANGE_EMAIL_DISABLED:
    "Le changement d'adresse e-mail n'est pas disponible pour le moment.",
  EMAIL_CAN_NOT_BE_UPDATED: "Cette adresse e-mail ne peut pas être utilisée.",
};

/**
 * Transforme n'importe quel échec en une phrase affichable.
 *
 * Deux familles, et elles ne se traitent pas pareil : un `APIError` est un REFUS
 * — la librairie a compris la demande et dit non, il y a donc quelque chose
 * d'utile à dire au visiteur. Tout le reste est une PANNE, dont le détail ne le
 * concerne pas et ne doit surtout pas lui être montré.
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

  /* Base injoignable, variable d'environnement absente… Rien d'utile à dire au
     visiteur, mais la trace serveur doit exister : sans elle, une panne de base
     ressemble à un mauvais mot de passe. */
  console.error("[auth]", error);
  return {
    tone: "error",
    message: "Le service est momentanément indisponible. Réessayez plus tard.",
  };
}

/** Lecture d'un champ texte. L'espace autour d'une adresse saisie ne compte pas. */
export function readTrimmed(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Le mot de passe, lui, est lu BRUT. Un espace en début ou en fin en fait
 * partie : le rogner à l'inscription et pas à la connexion — ou l'inverse —
 * fabrique un compte auquel son propre propriétaire n'accède plus.
 *
 * C'est la règle qui justifie à elle seule que ce fichier existe : elle doit
 * être la même partout, or rien ne la rappelle sur le lieu de l'appel.
 */
export function readRaw(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
