"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { readRaw, readTrimmed, toMessage } from "@/lib/auth-forms";
import { getCurrentUser } from "@/lib/session";
import type { AuthFormState } from "@/types/auth";

/**
 * Ce qu'on fait de son compte UNE FOIS DEDANS : changer ses informations, son
 * mot de passe, ou tout supprimer.
 *
 * `lib/auth-actions.ts` est l'autre moitié — ce qui se passe avant la porte. Le
 * partage (traduction des refus, lecture des champs) est dans
 * `lib/auth-forms.ts`.
 *
 * ── AUCUNE DE CES ACTIONS NE REÇOIT UN IDENTIFIANT DE COMPTE ──
 * Elles le lisent dans la session. Un `userId` passé en paramètre serait un
 * paramètre modifiable depuis les outils de développement, donc une façon de
 * renommer ou de supprimer le compte de quelqu'un d'autre. Même règle que
 * `lib/favorites-actions.ts`.
 *
 * ── AUCUNE NE REDIRIGE ──
 * Contrairement à la connexion, on reste sur la page : ces trois formulaires
 * modifient ce qui est affiché juste à côté d'eux. C'est ce qui rend le ton
 * `success` nécessaire (voir `types/auth`) — sans un mot, rien ne distingue
 * « c'est enregistré » de « le bouton n'a pas marché ».
 */

/** La page à recalculer après un changement : c'est elle qui affiche le compte. */
const SETTINGS_PATH = "/compte/profil";

/**
 * Session perdue en cours de route — expirée, ou compte supprimé dans un autre
 * onglet. Réponse commune aux trois actions : il n'y a rien à faire d'utile,
 * mais le dire évite un formulaire qui semble ne pas répondre.
 */
const NO_SESSION: AuthFormState = {
  tone: "error",
  message: "Votre session a expiré. Reconnectez-vous, puis recommencez.",
};

/**
 * Nom et adresse e-mail, dans un seul formulaire.
 *
 * ── DEUX APPELS DE LIBRAIRIE DERRIÈRE UN SEUL BOUTON ──
 * Better Auth sépare `updateUser` (le nom) de `changeEmail` (l'adresse), parce
 * que changer d'adresse est une opération sensible qui peut demander une
 * confirmation. Les réunir à l'écran est pourtant le bon choix : ce sont les
 * deux mêmes informations, sur la même ligne du même compte, et deux boutons
 * « Enregistrer » côte à côte auraient surtout produit des enregistrements à
 * moitié faits.
 *
 * ── CHAQUE APPEL N'EST FAIT QUE SI LA VALEUR A CHANGÉ ──
 * Ce n'est pas une économie de requête : `changeEmail` REFUSE une adresse
 * identique à l'actuelle, avec une erreur sans code — donc intraduisible, et
 * qui tomberait dans le message générique. Enregistrer un nom sans toucher à
 * son adresse afficherait « la demande n'a pas pu aboutir » sur une demande qui
 * a parfaitement abouti.
 */
export async function updateProfileAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const current = await getCurrentUser();
  if (!current) return NO_SESSION;

  const name = readTrimmed(formData, "name");
  /* En minuscules, comme le fait Better Auth de son côté : sans ça, corriger la
     casse de sa propre adresse serait vu comme un changement, et refusé comme
     identique à l'actuelle. */
  const email = readTrimmed(formData, "email").toLowerCase();

  /* Le `required` du champ couvre déjà le cas côté navigateur ; un nom d'espaces
     le traverse pourtant, et Better Auth l'accepterait. Un compte sans nom
     visible n'est pas un compte cassé, mais c'est un « Bonjour » suivi de rien. */
  if (!name) {
    return { tone: "error", message: "Le nom ne peut pas être vide." };
  }

  const emailChanged = email !== current.email;

  try {
    if (name !== current.name) {
      await auth.api.updateUser({ body: { name }, headers: await headers() });
    }

    if (emailChanged) {
      await auth.api.changeEmail({
        body: { newEmail: email },
        headers: await headers(),
      });
    }
  } catch (error) {
    return toMessage(error);
  }

  /* Sans lui, la page garde le rendu qu'elle avait avant l'envoi : le formulaire
     réafficherait l'ancien nom au-dessus du message qui annonce le nouveau. */
  revalidatePath(SETTINGS_PATH);

  /**
   * DEUX MESSAGES, ET LE SECOND N'AFFIRME RIEN.
   *
   * Quand l'adresse demandée appartient déjà à un autre compte, Better Auth
   * répond « succès » sans rien changer — pour ne pas révéler l'existence de ce
   * compte (voir `lib/auth.ts`). Écrire « votre adresse a bien été modifiée »
   * serait donc parfois faux, et le corriger en « cette adresse est déjà prise »
   * reviendrait à rétablir exactement la fuite que la librairie évite.
   *
   * On renvoie donc le visiteur vers la seule source exacte : le champ juste
   * au-dessus, que `revalidatePath` vient de remplir avec l'adresse réellement
   * enregistrée (lue en base par `lib/account.ts`, pas dans la session).
   */
  return {
    tone: "success",
    message: emailChanged
      ? "Vos informations sont enregistrées. Le champ ci-dessus affiche l'adresse e-mail actuellement rattachée à votre compte."
      : "Vos informations sont enregistrées.",
  };
}

/**
 * Changer de mot de passe.
 *
 * `revokeOtherSessions: true` — LA SEULE RAISON DE CHANGER DE MOT DE PASSE est
 * souvent qu'on craint que quelqu'un le connaisse. Laisser ouvertes les sessions
 * déjà en cours ailleurs rendrait l'opération décorative : l'intrus garderait
 * son accès. La session COURANTE, elle, est conservée — se faire déconnecter de
 * la page sur laquelle on vient d'agir serait pris pour une erreur.
 */
export async function changePasswordAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const current = await getCurrentUser();
  if (!current) return NO_SESSION;

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: readRaw(formData, "currentPassword"),
        newPassword: readRaw(formData, "newPassword"),
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch (error) {
    return toMessage(error);
  }

  return {
    tone: "success",
    message:
      "Votre mot de passe est modifié. Les autres appareils connectés à ce compte ont été déconnectés.",
  };
}

/**
 * Supprimer le compte, définitivement.
 *
 * ── LE MOT DE PASSE EST DEMANDÉ, ET CE N'EST PAS UNE FORMALITÉ ──
 * C'est la seule action irréversible du site. Better Auth accepte deux façons de
 * la confirmer : le mot de passe, ou une session « fraîche » — ouverte il y a
 * moins d'un certain temps. La seconde a l'air plus douce et elle est pire :
 * elle laisse supprimer un compte sans rien prouver, simplement parce qu'on
 * vient de se connecter, donc typiquement sur un poste laissé ouvert.
 *
 * ── LES FAVORIS PARTENT AVEC ──
 * Non pas parce que cette action les supprime, mais parce que la table les
 * rattache au compte avec `onDelete: "cascade"` (voir `db/schema.ts`). La
 * promesse du bouton est tenue par la base, pas par une ligne de code qu'un
 * refactoring peut oublier.
 *
 * ── ELLE NE REDIRIGE PAS, ET C'EST VOULU ──
 * Une `redirect()` ferait une navigation côté client : le cache de session du
 * navigateur, lui, continuerait d'afficher un visiteur connecté dans le Header —
 * le même piège que la déconnexion (voir `account/SignOutButton`). C'est
 * `account/DeleteAccountPanel` qui provoque un rechargement COMPLET, seule
 * façon sûre de ne rien laisser derrière.
 */
export async function deleteAccountAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const current = await getCurrentUser();
  if (!current) return NO_SESSION;

  try {
    await auth.api.deleteUser({
      body: { password: readRaw(formData, "password") },
      headers: await headers(),
    });
  } catch (error) {
    return toMessage(error);
  }

  return {
    tone: "success",
    message: "Votre compte a été supprimé. Vous allez revenir à l'accueil.",
  };
}
