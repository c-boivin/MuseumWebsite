"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Les pages d'où l'on peut ressortir connecté.
 *
 * `/mot-de-passe-oublie` n'y est pas : elle n'authentifie personne, et ne le
 * fera pas davantage le jour où elle enverra un e-mail — on en repart avec un
 * message, pas avec une session.
 */
const AUTH_PATHS = ["/connexion", "/inscription"];

/**
 * Prévient le navigateur qu'il vient de se connecter.
 *
 * ── LE BUG QU'IL CORRIGE, ET IL ÉTAIT INVISIBLE À LA RELECTURE ──
 * Le client Better Auth garde la session dans un cache de page. Ce cache se
 * remplit à deux moments seulement : au MONTAGE du premier composant qui appelle
 * `useSession()`, et quand le client s'invalide lui-même — ce qu'il fait après
 * ses propres `signIn` / `signOut`.
 *
 * Or on se connecte ici par une Server Action. Elle pose bien le cookie, puis
 * `redirect()` effectue une navigation CÔTÉ CLIENT : le root layout n'est pas
 * remonté, `layout/AccountLink` non plus, et rien n'a invalidé quoi que ce soit.
 * Le cache garde donc le « personne n'est connecté » qu'il avait relevé en
 * arrivant sur la page de connexion. Résultat : on se connecte, on atterrit dans
 * son espace compte — et le header affiche toujours « Connexion », jusqu'au
 * prochain rechargement complet. Les favoris restaient muets pour la même
 * raison, `account/FavoritesSync` attendant un identifiant qui ne venait jamais.
 *
 * C'est le PENDANT EXACT du problème traité dans `account/SignOutButton`, dans
 * l'autre sens : là-bas on quitte une session que le navigateur croit encore
 * ouverte, ici on en ouvre une qu'il croit encore fermée. La règle à retenir :
 * **une identité qui change sur le serveur ne se voit jamais toute seule côté
 * navigateur.**
 *
 * ── POURQUOI SUR LE CHANGEMENT DE CHEMIN, ET PAS DANS LE FORMULAIRE ──
 * Le formulaire ne peut pas s'en charger : quand l'action réussit, elle
 * redirige, donc `sections/AuthForm` est démonté sans jamais recevoir de
 * réponse. Le seul témoin de l'événement est la navigation elle-même.
 *
 * ── ET POURQUOI PAS À CHAQUE NAVIGATION ──
 * Ce serait une requête de session par page pour tout le monde, y compris pour
 * les visiteurs sans compte, c'est-à-dire presque tous. On ne redemande donc que
 * si l'on QUITTE une page de connexion ou d'inscription — les deux seuls
 * endroits d'où l'on peut ressortir avec une identité nouvelle. Une navigation
 * entre ces deux pages ne compte pas : personne ne s'est connecté en chemin.
 *
 * ── `refetch` ET NON UN SIGNAL INTERNE ──
 * C'est l'API publique du hook, et elle ne consulte pas la fenêtre de fraîcheur
 * que respecte le chargement initial (vérifié dans `session-atom.mjs` de la
 * 1.7.5) : l'appel part vraiment, ce qui est tout l'intérêt ici.
 */
export function SessionSync() {
  const pathname = usePathname();
  const { refetch } = authClient.useSession();

  /* Le chemin d'où l'on vient. Au premier rendu il vaut le chemin courant, donc
     l'effet ne déclenche rien : arriver directement sur `/connexion` n'est pas
     en repartir. */
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
