"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { listFavoritesAction } from "@/lib/favorites-actions";
import { useFavoritesStore } from "@/lib/store";

/**
 * Remplit le cache des favoris au chargement, et le vide à la déconnexion.
 *
 * Même motif que `motion/ScrollMemoryReset` : il ne rend aucun balisage, il
 * existe pour brancher un effet là où aucun composant visible ne pourrait le
 * porter. Les boutons favoris sont dispersés dans les 39 cartes, les fiches et
 * l'espace compte — aucun n'est l'ancêtre des autres.
 *
 * Une seule requête par visite, et aucune pour un visiteur sans compte. La
 * session n'est pas redemandée : le client Better Auth partage un seul état
 * entre tous les appels à `useSession()`.
 *
 * `loadedFor` retient POUR QUI le cache a été rempli : un simple drapeau
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

    /* Le cache peut déjà être rempli : la page `/compte` l'amorce avec ce
       qu'elle vient de lire en base. Repartir chercher la même liste serait une
       requête pour rien, et une seconde réponse susceptible d'écraser un ajout
       fait entre-temps.

       `getState()` et non un abonnement, qui relancerait l'effet à chaque
       changement de favori. */
    if (useFavoritesStore.getState().slugs !== null) return;

    /* Une navigation pendant la requête démonte le composant : sans ce drapeau,
       la réponse remplirait le cache d'un compte qui n'est plus celui affiché. */
    let cancelled = false;

    listFavoritesAction()
      .then((slugs) => {
        if (!cancelled) load(slugs);
      })
      .catch((error) => {
        /* Le cache reste à `null`, donc les boutons restent inertes plutôt que
           d'afficher « pas en favori » pour tout le catalogue. */
        console.error("[favorites]", error);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, load, clear]);

  return null;
}
