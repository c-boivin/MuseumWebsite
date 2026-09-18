import { createAuthClient } from "better-auth/react";

/**
 * Le pendant navigateur de `lib/auth.ts`.
 *
 * ── POURQUOI IL EXISTE ALORS QUE TOUT PASSE PAR DES SERVER ACTIONS ──
 * Il ne sert PAS à s'inscrire ni à se connecter : ces deux parcours restent sur
 * le serveur, pour que le mot de passe ne traverse aucun JavaScript de page
 * (voir l'en-tête de `lib/auth-actions.ts`). Il sert aux deux choses qu'une
 * Server Action ne sait pas faire :
 *
 * 1. SAVOIR SI L'ON EST CONNECTÉ SANS RENDRE LE SITE DYNAMIQUE. Le Header est
 *    monté par le root layout ; lui faire lire la session côté serveur voudrait
 *    dire appeler `headers()` dans ce layout, donc basculer TOUTES les pages du
 *    site en rendu dynamique — `/collection` et les 39 fiches pré-générées
 *    comprises. Interroger la session depuis le navigateur laisse ces pages
 *    statiques : c'est un composant client qui change d'avis après coup, pas une
 *    page qui cesse d'être pré-calculable. Arbitrage détaillé dans CLAUDE.md.
 * 2. SE DÉCONNECTER. Une déconnexion faite côté serveur supprimerait bien la
 *    session en base, mais le cache de `useSession()` — qui vit dans le
 *    navigateur — n'en saurait rien : le Header continuerait d'afficher « Mon
 *    compte » jusqu'au prochain rechargement complet. En passant par ce client,
 *    c'est lui qui vide son propre cache.
 *
 * ── CE QU'IL APPELLE ──
 * La route attrape-tout `app/api/auth/[...all]/route.ts`, qui n'existait que
 * pour ça. `useSession()` interroge `/api/auth/get-session`, `signOut()` appelle
 * `/api/auth/sign-out`.
 *
 * Pas de `baseURL` : le client et le serveur sont sur la même origine, Better
 * Auth déduit l'URL de la page courante. Elle ne deviendrait nécessaire qu'avec
 * un front et une API sur deux domaines.
 */
export const authClient = createAuthClient();
