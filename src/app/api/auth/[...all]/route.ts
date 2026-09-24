import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/**
 * Le point de montage HTTP de Better Auth : une route attrape-tout qui expose
 * `/api/auth/sign-in/email`, `/api/auth/sign-out`, `/api/auth/get-session`… On
 * n'écrit aucun de ces points d'entrée, la librairie les fournit.
 *
 * C'est la seule route d'API du site.
 *
 * Elle n'est pas appelée par les formulaires, qui passent par des Server Actions
 * s'adressant à `auth.api.*` en mémoire. Ce n'est pas du code mort pour autant :
 * elle devient nécessaire dès la première chose faite depuis le navigateur —
 * `useSession` interroge `get-session`, et la déconnexion `sign-out`.
 */
export const { GET, POST } = toNextJsHandler(auth);
