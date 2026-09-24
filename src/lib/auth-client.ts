import { createAuthClient } from "better-auth/react";

/**
 * Le pendant navigateur de `lib/auth.ts`.
 *
 * Il ne sert pas à s'inscrire ni à se connecter — ces parcours restent sur le
 * serveur — mais aux deux choses qu'une Server Action ne sait pas faire :
 *
 * 1. savoir si l'on est connecté sans rendre le site dynamique. Le Header est
 *    monté par le root layout ; y appeler `headers()` basculerait toutes les
 *    pages en rendu dynamique, les 39 fiches pré-générées comprises ;
 * 2. se déconnecter. Une déconnexion côté serveur supprimerait la session en
 *    base, mais le cache de `useSession()` n'en saurait rien et le Header
 *    afficherait « Mon compte » jusqu'au prochain rechargement.
 *
 * Il appelle la route attrape-tout `app/api/auth/[...all]/route.ts`, qui
 * n'existe que pour ça.
 *
 * Pas de `baseURL` : client et serveur sont sur la même origine. Elle ne
 * deviendrait nécessaire qu'avec un front et une API sur deux domaines.
 */
export const authClient = createAuthClient();
