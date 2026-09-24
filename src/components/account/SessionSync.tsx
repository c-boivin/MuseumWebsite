"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Les pages d'où l'on peut ressortir connecté. `/mot-de-passe-oublie` n'y est
 * pas : on en repart avec un message, pas avec une session.
 */
const AUTH_PATHS = ["/connexion", "/inscription"];

/**
 * Prévient le navigateur qu'il vient de se connecter.
 *
 * Le client Better Auth remplit son cache de session à deux moments seulement :
 * au montage du premier `useSession()`, et après ses propres `signIn`/`signOut`.
 * Or on se connecte ici par une Server Action : le cookie est posé, mais
 * `redirect()` fait une navigation client, le root layout n'est pas remonté et
 * rien n'invalide le cache. On atterrit dans son espace compte et le header
 * affiche toujours « Connexion ».
 *
 * C'est le pendant exact de `account/SignOutButton`, dans l'autre sens. La règle
 * à retenir : une identité qui change sur le serveur ne se voit jamais toute
 * seule côté navigateur.
 *
 * Sur le changement de chemin et non dans le formulaire : quand l'action
 * réussit, elle redirige, donc `AuthForm` est démonté sans recevoir de réponse.
 * Le seul témoin est la navigation.
 *
 * Pas à chaque navigation non plus : ce serait une requête de session par page
 * pour tout le monde. On ne redemande que si l'on quitte une page de connexion
 * ou d'inscription.
 *
 * `refetch` est l'API publique du hook, et elle ignore la fenêtre de fraîcheur
 * du chargement initial — l'appel part vraiment.
 */
export function SessionSync() {
  const pathname = usePathname();
  const { refetch } = authClient.useSession();

  /* Au premier rendu il vaut le chemin courant, donc l'effet ne déclenche rien :
     arriver sur `/connexion` n'est pas en repartir. */
  const previous = useRef(pathname);

  useEffect(() => {
    const from = previous.current;
    previous.current = pathname;

    if (from === pathname) return;
    if (!AUTH_PATHS.includes(from)) return;
    /* `/connexion` → `/inscription` : on change de formulaire, pas d'identité. */
    if (AUTH_PATHS.includes(pathname)) return;

    void refetch();
  }, [pathname, refetch]);

  return null;
}
