"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { listFavoritesAction } from "@/lib/favorites-actions";
import { useFavoritesStore } from "@/lib/store";

/**
 * Remplit le cache des favoris au chargement, et le vide à la déconnexion.
 *
 * ── UN COMPOSANT QUI N'AFFICHE RIEN, MONTÉ DANS LE ROOT LAYOUT ──
 * Le même motif que `motion/ScrollMemoryReset` : il ne rend aucun balisage, il
 * existe pour brancher un effet à un endroit où aucun composant visible ne
 * pourrait le porter. Les boutons favoris sont dispersés dans les 39 cartes de
 * la collection, dans les fiches et dans l'espace compte — aucun d'eux n'est
 * l'ancêtre des autres, et chacun d'eux ne peut pas déclencher son propre
 * chargement.
 *
 * ── UNE SEULE REQUÊTE PAR VISITE, ET AUCUNE POUR UN VISITEUR SANS COMPTE ──
 * Elle ne part que si une session existe. La session elle-même n'est pas
 * redemandée ici : le client React de Better Auth partage un seul état entre
 * tous les appels à `useSession()`, celui du Header et celui-ci sont donc la
 * même requête.
 *
 * ── LE GARDE-FOU EST SUR L'IDENTIFIANT, PAS SUR UN BOOLÉEN ──
 * `loadedFor` retient POUR QUI le cache a été rempli. Un simple drapeau
 * « déjà chargé » laisserait les favoris du premier compte à l'écran si un
 * second se connectait dans le même onglet.
 */
export function FavoritesSync() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id ?? null;

  const load = useFavoritesStore((state) => state.load);
  const clear = useFavoritesStore((state) => state.clear);

  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      loadedFor.current = null;
      clear();
      return;
    }

    if (loadedFor.current === userId) return;
    loadedFor.current = userId;

    /* LE CACHE PEUT DÉJÀ ÊTRE REMPLI : la page `/compte` l'amorce avec ce
       qu'elle vient de lire en base pour son propre rendu. Repartir chercher la
       même liste serait une requête pour rien, et surtout une seconde réponse
       susceptible d'écraser un ajout fait entre-temps.

       `getState()` et non un `useFavoritesStore(...)` : on veut la valeur à
       l'instant de l'effet, pas un abonnement qui relancerait l'effet à chaque
       changement de favori. */
    if (useFavoritesStore.getState().slugs !== null) return;

    /* Une navigation pendant la requête démonte le composant : sans ce drapeau,
       la réponse arriverait après coup et remplirait le cache d'un compte qui
       n'est peut-être plus celui affiché. */
    let cancelled = false;

    listFavoritesAction()
      .then((slugs) => {
        if (!cancelled) load(slugs);
      })
      .catch((error) => {
        /* Le cache reste à `null`, donc les boutons restent inertes plutôt que
           d'afficher « pas en favori » pour tout le catalogue. Voir le
           commentaire de `slugs` dans `lib/store.ts`. */
        console.error("[favorites]", error);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, load, clear]);

  return null;
}
