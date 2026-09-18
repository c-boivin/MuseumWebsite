import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/**
 * Le point de montage HTTP de Better Auth : une route attrape-tout qui expose
 * d'un coup `/api/auth/sign-in/email`, `/api/auth/sign-out`,
 * `/api/auth/get-session`, `/api/auth/callback/{provider}`… On n'écrit aucun de
 * ces points d'entrée, la librairie les fournit.
 *
 * C'EST LA SEULE ROUTE D'API DU SITE, et la seule chose qui ne soit pas du
 * routage de page dans `app/` — tout le reste du musée se rend sur le serveur.
 *
 * ELLE N'EST PAS ENCORE APPELÉE, et c'est voulu : les formulaires de compte
 * passent par des Server Actions, qui s'adressent à `auth.api.*` directement en
 * mémoire, sans requête HTTP. La garder ici n'est pas du code mort par
 * distraction — c'est la surface publique de la librairie, et elle devient
 * nécessaire dès la première chose faite depuis le navigateur : afficher l'état
 * de connexion dans le Header (`useSession` interroge `get-session`), se
 * déconnecter, ou brancher un fournisseur externe, dont le retour tombe sur
 * `/api/auth/callback/…` et nulle part ailleurs.
 */
export const { GET, POST } = toNextJsHandler(auth);
