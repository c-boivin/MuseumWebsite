"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { readRaw, readTrimmed, toMessage } from "@/lib/auth-forms";
import { addFavorite, isArtworkSlug } from "@/lib/favorites";
import type { AuthFormState } from "@/types/auth";

/**
 * Connexion, inscription, mot de passe oublié.
 *
 * Tout passe par des Server Actions et non par `authClient` : le mot de passe ne
 * traverse aucun JavaScript de page, et `AuthPanel` comme les trois pages
 * restent des Server Components. Contrepartie assumée, un aller-retour serveur
 * sur un formulaire envoyé une fois.
 *
 * Ce qu'on fait une fois dedans est dans `lib/account-actions.ts`, le partage
 * dans `lib/auth-forms.ts`. La déconnexion n'est dans aucun des deux : elle doit
 * passer par le navigateur, sinon le cache de `useSession()` continue d'afficher
 * un visiteur connecté. Voir `account/SignOutButton`.
 */

/**
 * Où l'on atterrit une fois connecté.
 *
 * L'espace compte et non l'accueil, où rien ne changeait d'apparence : la
 * session existait mais c'était invisible, donc raté. `/compte/collection` est
 * la seule page dont le contenu n'existe que parce qu'on s'est connecté.
 */
const AFTER_AUTH = "/compte/collection";

/**
 * Le signet d'une œuvre emporte son intention dans l'URL (voir
 * `artwork/FavoriteButton`) : sans ça on ressortait dans « Ma collection », sans
 * l'œuvre qu'on voulait mettre de côté.
 *
 * La valeur vient de l'URL, donc elle n'est pas digne de confiance : rediriger
 * vers une adresse fournie par le visiteur est la faille dite de « redirection
 * ouverte ». On n'accepte que des chemins internes, et les trois refus ne sont
 * pas interchangeables :
 *  - pas de `/` initial : une adresse absolue, donc un autre site ;
 *  - `//` : un chemin relatif au protocole, que le navigateur lit `https://…` ;
 *  - `/\` : certains navigateurs normalisent la barre inversée, d'où le cas
 *    précédent.
 *
 * On refuse enfin de revenir sur une page du parcours de compte, qui ferait
 * boucler le visiteur sur un formulaire dont il n'a plus besoin.
 */
const AUTH_PATHS = ["/connexion", "/inscription", "/mot-de-passe-oublie"];

function safeReturnPath(formData: FormData): string {
  const raw = readTrimmed(formData, "retour");

  if (!raw.startsWith("/")) return AFTER_AUTH;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return AFTER_AUTH;

  const path = raw.split("?")[0];
  if (AUTH_PATHS.includes(path)) return AFTER_AUTH;

  return raw;
}

/**
 * Met de côté l'œuvre que le visiteur voulait ajouter avant d'être arrêté.
 *
 * Le `catch` est sans conséquence : la connexion a réussi, c'est ce qui a été
 * demandé. Annoncer un échec parce qu'une ligne de favori n'a pas pu s'écrire
 * laisserait croire qu'on n'est pas connecté.
 */
async function applyPendingFavorite(userId: string, formData: FormData) {
  const slug = readTrimmed(formData, "oeuvre");
  if (!slug || !isArtworkSlug(slug)) return;

  try {
    await addFavorite(userId, slug);
  } catch (error) {
    console.error("[favorites]", error);
  }
}

export async function signUpAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  let userId: string;

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: readTrimmed(formData, "name"),
        email: readTrimmed(formData, "email"),
        password: readRaw(formData, "password"),
      },
      /* Better Auth y lit l'IP et le navigateur pour la session, et c'est par
         cette réponse que `nextCookies()` fait poser le cookie. */
      headers: await headers(),
    });

    userId = result.user.id;
  } catch (error) {
    return toMessage(error);
  }

  await applyPendingFavorite(userId, formData);

  /* Hors du `try`, obligatoirement : `redirect()` lève une exception que Next
     intercepte, notre `catch` l'attraperait le premier et la redirection
     deviendrait un message d'erreur sur une inscription réussie. */
  redirect(safeReturnPath(formData));
}

export async function signInAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  let userId: string;

  try {
    const result = await auth.api.signInEmail({
      body: {
        email: readTrimmed(formData, "email"),
        password: readRaw(formData, "password"),
      },
      headers: await headers(),
    });

    userId = result.user.id;
  } catch (error) {
    return toMessage(error);
  }

  await applyPendingFavorite(userId, formData);

  redirect(safeReturnPath(formData));
}

/**
 * La seule des trois qui ne fait rien, et qui le dit : envoyer un lien suppose
 * un service d'e-mails hors périmètre. Faire semblant aurait été pire, ça met le
 * visiteur à attendre quelque chose qui n'arrivera jamais.
 */
export async function requestPasswordResetAction(): Promise<AuthFormState> {
  return {
    tone: "notice",
    message:
      "La réinitialisation par e-mail n'est pas encore en service sur ce site. Contactez l'accueil du musée pour retrouver l'accès à votre compte.",
  };
}
