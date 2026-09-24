"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { readRaw, readTrimmed, toMessage } from "@/lib/auth-forms";
import { getCurrentUser } from "@/lib/session";
import type { AuthFormState } from "@/types/auth";

/**
 * Ce qu'on fait de son compte une fois dedans. `lib/auth-actions.ts` est
 * l'autre moitié, `lib/auth-forms.ts` le partage.
 *
 * Aucune de ces actions ne reçoit d'identifiant de compte : elles le lisent dans
 * la session. Un `userId` en paramètre serait modifiable depuis les outils de
 * développement, donc une façon de supprimer le compte de quelqu'un d'autre.
 *
 * Aucune ne redirige : ces trois formulaires modifient ce qui est affiché juste
 * à côté d'eux, d'où le ton `success` — sans un mot, rien ne distingue « c'est
 * enregistré » de « le bouton n'a pas marché ».
 */

/** La page à recalculer après un changement : c'est elle qui affiche le compte. */
const SETTINGS_PATH = "/compte/profil";

/**
 * Session expirée, ou compte supprimé dans un autre onglet. Le dire évite un
 * formulaire qui semble ne pas répondre.
 */
const NO_SESSION: AuthFormState = {
  tone: "error",
  message: "Votre session a expiré. Reconnectez-vous, puis recommencez.",
};

/**
 * Nom et adresse e-mail dans un seul formulaire, alors que Better Auth sépare
 * `updateUser` de `changeEmail` : ce sont les deux mêmes informations du même
 * compte, et deux boutons « Enregistrer » côte à côte auraient produit des
 * enregistrements à moitié faits.
 *
 * Chaque appel n'est fait que si la valeur a changé, et ce n'est pas une
 * économie de requête : `changeEmail` refuse une adresse identique à l'actuelle
 * avec une erreur sans code, donc intraduisible. Enregistrer un nom sans toucher
 * à son adresse afficherait un échec sur une demande qui a abouti.
 */
export async function updateProfileAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const current = await getCurrentUser();
  if (!current) return NO_SESSION;

  const name = readTrimmed(formData, "name");
  /* En minuscules, comme Better Auth : sinon corriger la casse de sa propre
     adresse serait vu comme un changement, et refusé comme identique. */
  const email = readTrimmed(formData, "email").toLowerCase();

  /* Le `required` du champ ne couvre pas un nom d'espaces, que Better Auth
     accepterait — et qui donne un « Bonjour » suivi de rien. */
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

  /* Sans lui, le formulaire réafficherait l'ancien nom au-dessus du message qui
     annonce le nouveau. */
  revalidatePath(SETTINGS_PATH);

  /**
   * Le second message n'affirme rien : quand l'adresse appartient déjà à un
   * autre compte, Better Auth répond « succès » sans rien changer, pour ne pas
   * révéler son existence (voir `lib/auth.ts`). Annoncer la modification serait
   * parfois faux, et dire « déjà prise » rétablirait la fuite qu'elle évite.
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
 * `revokeOtherSessions: true` : on change souvent de mot de passe parce qu'on
 * craint que quelqu'un le connaisse, laisser ouvertes les sessions en cours
 * ailleurs rendrait l'opération décorative. La session courante est conservée,
 * s'en faire déconnecter serait pris pour une erreur.
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
 * Le mot de passe est demandé plutôt que la « session fraîche » que Better Auth
 * accepte aussi : celle-ci laisse supprimer un compte sans rien prouver, sur un
 * poste laissé ouvert.
 *
 * Les favoris partent avec, non par cette action mais par le `onDelete:
 * "cascade"` de la table (voir `db/schema.ts`) : la promesse est tenue par la
 * base, pas par une ligne de code qu'un refactoring peut oublier.
 *
 * Elle ne redirige pas : une `redirect()` ferait une navigation client et le
 * cache de session continuerait d'afficher un visiteur connecté dans le Header.
 * C'est `account/DeleteAccountPanel` qui provoque un rechargement complet.
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
