"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { readRaw, readTrimmed, toMessage } from "@/lib/auth-forms";
import { addFavorite, isArtworkSlug } from "@/lib/favorites";
import type { AuthFormState } from "@/types/auth";

/**
 * Soumission des formulaires de compte — connexion, inscription, mot de passe
 * oublié.
 *
 * TOUT SE PASSE SUR LE SERVEUR, par des Server Actions plutôt que par le client
 * `authClient` du navigateur. Trois raisons, dans l'ordre d'importance :
 *
 * 1. Le mot de passe ne traverse aucun JavaScript de page. Le navigateur poste
 *    le formulaire, le serveur le reçoit — c'est le trajet le plus court, et
 *    celui qui reste valable si le JS est coupé ou en erreur.
 * 2. `AuthPanel` et les trois pages restent des Server Components. Seul le
 *    `sections/AuthForm` qui affiche l'erreur est client, et il ne touche pas
 *    aux champs.
 * 3. C'est cohérent avec le reste du site, où aucune donnée n'est allée
 *    chercher son API depuis le navigateur.
 *
 * Contrepartie assumée : un aller-retour serveur là où le client aurait pu
 * répondre plus vite. Sur un formulaire envoyé une fois, c'est indolore.
 *
 * ── CE FICHIER EST CELUI D'AVANT LA PORTE ──
 * Ce qu'on fait UNE FOIS DEDANS — changer son nom, son adresse, son mot de
 * passe, supprimer son compte — est dans `lib/account-actions.ts`. Le partage,
 * c'est-à-dire la traduction des refus de la librairie et la lecture des champs,
 * est dans `lib/auth-forms.ts`.
 *
 * LA SEULE OPÉRATION DE COMPTE QUI N'EST DANS AUCUN DES DEUX est la
 * déconnexion : elle doit passer par le navigateur, sans quoi le cache de
 * `useSession()` continue d'afficher un visiteur connecté. Voir
 * `account/SignOutButton`.
 */

/**
 * Où l'on atterrit une fois connecté.
 *
 * L'ESPACE COMPTE, ET NON L'ACCUEIL. Le placeholder précédent renvoyait sur
 * l'accueil, où rien ne changeait d'apparence : on venait de se connecter et le
 * site était exactement celui qu'on avait quitté. La session existait pourtant,
 * son cookie était posé et sa ligne en base — c'était invisible, donc c'était
 * raté.
 *
 * `/compte/collection`, ce sont les œuvres mises de côté. C'est la seule page dont le
 * contenu n'existe QUE parce qu'on s'est connecté : elle prouve la connexion en
 * la montrant, au lieu de l'annoncer par un message.
 */
const AFTER_AUTH = "/compte/collection";

/**
 * Où renvoyer le visiteur, quand il venait de quelque part.
 *
 * ── LE PARCOURS QUE ÇA RÉPARE ──
 * Déconnecté, on clique sur le signet d'une œuvre : le site envoie vers la
 * connexion. Sans ce qui suit, on ressortait dans « Ma collection », qui n'est
 * pas la page qu'on regardait, et SANS l'œuvre qu'on voulait mettre de côté — le
 * clic de départ était purement et simplement perdu. Le signet emporte donc son
 * intention dans l'URL (`layout` : voir `artwork/FavoriteButton`), et elle
 * traverse le formulaire jusqu'ici.
 *
 * ── LA VALEUR VIENT DE L'URL, DONC ELLE N'EST PAS DIGNE DE CONFIANCE ──
 * Rediriger vers une adresse fournie par le visiteur, c'est la faille dite de
 * « redirection ouverte » : il suffit d'envoyer à quelqu'un
 * `…/connexion?retour=https://evil.example` pour qu'il se connecte chez nous et
 * atterrisse ailleurs, en confiance, sur une page qui imitera la nôtre. On
 * n'accepte donc QUE des chemins internes.
 *
 * Les trois refus ne sont pas interchangeables :
 *  - ne commence pas par `/` : une adresse absolue, donc un autre site ;
 *  - commence par `//` : un chemin « relatif au protocole », que le navigateur
 *    lit comme `https://…` — c'est la forme qui passe tous les filtres naïfs ;
 *  - commence par `/\` : certains navigateurs normalisent la barre inversée en
 *    barre oblique, ce qui ramène au cas précédent.
 *
 * On refuse enfin de revenir sur une page du parcours de compte : on vient de
 * s'y connecter, y retourner referait boucler le visiteur sur un formulaire dont
 * il n'a plus besoin.
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
 * Met de côté l'œuvre que le visiteur voulait ajouter avant d'être arrêté par la
 * porte.
 *
 * ── ELLE NE FAIT JAMAIS ÉCHOUER LA CONNEXION ──
 * Le `catch` est vide de conséquence, et c'est délibéré : la connexion a réussi,
 * c'est ce que le visiteur a demandé. Lui renvoyer « la demande n'a pas pu
 * aboutir » parce qu'une ligne de favori n'a pas pu s'écrire serait mentir sur
 * ce qui s'est passé — et le laisser croire qu'il n'est pas connecté alors qu'il
 * l'est. L'œuvre manquera, il lui restera un clic à refaire.
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
      /* Les en-têtes de la requête en cours : Better Auth y lit l'IP et le
         navigateur pour les inscrire sur la session, et c'est par cette réponse
         que `nextCookies()` fait poser le cookie. */
      headers: await headers(),
    });

    userId = result.user.id;
  } catch (error) {
    return toMessage(error);
  }

  await applyPendingFavorite(userId, formData);

  /* HORS DU `try`, ET C'EST OBLIGATOIRE. `redirect()` fonctionne en levant une
     exception que Next intercepte lui-même ; à l'intérieur du bloc, notre
     `catch` l'attraperait le premier et la redirection deviendrait un message
     d'erreur — sur une inscription qui a pourtant réussi.

     Better Auth ouvre la session dans la foulée de l'inscription : on arrive
     connecté, sans repasser par la page de connexion. */
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
 * Mot de passe oublié — LA SEULE DES TROIS QUI NE FAIT RIEN, et qui le dit.
 *
 * Envoyer un lien de réinitialisation suppose un service d'envoi d'e-mails,
 * qu'on n'a pas et qui n'est pas au périmètre. Restaient trois options : retirer
 * la page, faire semblant, ou l'annoncer. Faire semblant était la pire —
 * afficher « un e-mail vous a été envoyé » met le visiteur à attendre quelque
 * chose qui n'arrivera jamais, et il n'a aucun moyen de le savoir.
 *
 * C'est la même position que le bouton « Payer » de la billetterie : le
 * parcours est dessiné jusqu'au bout, la dernière marche manque et le dit.
 */
export async function requestPasswordResetAction(): Promise<AuthFormState> {
  return {
    tone: "notice",
    message:
      "La réinitialisation par e-mail n'est pas encore en service sur ce site. Contactez l'accueil du musée pour retrouver l'accès à votre compte.",
  };
}
