"use client";

import { usePathname } from "next/navigation";
import { TransitionLink as Link } from "@/components/motion/TransitionLink";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { setFavoriteAction } from "@/lib/favorites-actions";
import { useFavoritesStore } from "@/lib/store";

interface FavoriteButtonProps {
  /** Identifiant de l'œuvre — celui de l'URL, et celui rangé en base. */
  slug: string;
  /**
   * Uniquement pour nommer le bouton : « Ajouter aux favoris » répété
   * trente-neuf fois donne trente-neuf boutons homonymes pour un lecteur d'écran.
   */
  title: string;
  /**
   * `icon` — une pastille posée sur une reproduction, dans une grille.
   * `labelled` — un bouton avec son texte, sur la fiche de l'œuvre.
   */
  variant?: "icon" | "labelled";
  className?: string;
}

/**
 * Mettre une œuvre de côté, ou l'en retirer.
 *
 * Trois états et non deux : il y a aussi « on ne sait pas encore ». La session
 * et la liste des favoris arrivent après le premier rendu, et afficher « pas en
 * favori » pendant ce temps ferait clignoter le signet des œuvres déjà mises de
 * côté. Tant qu'on ne sait pas, le bouton est inerte.
 *
 * Un visiteur sans compte voit un LIEN vers la connexion, pas un bouton grisé :
 * un bouton grisé montre une fonction sans dire comment y accéder. Et ça
 * navigue, donc c'est un lien.
 *
 * L'écran change avant le serveur : le cache local bascule au clic, l'appel part
 * ensuite, l'affichage revient en arrière si le serveur refuse.
 */
export function FavoriteButton({
  slug,
  title,
  variant = "icon",
  className,
}: FavoriteButtonProps) {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const slugs = useFavoritesStore((state) => state.slugs);
  const setLocal = useFavoritesStore((state) => state.setLocal);

  const isFavorite = slugs?.includes(slug) ?? false;

  const isIcon = variant === "icon";

  /* L'icône est posée sur une reproduction : elle a besoin d'un fond, un trait
     sombre sur une toile sombre disparaît. La version libellée vit sur le papier
     du site et reprend le ton discret du lien de retour. */
  const shape = isIcon
    ? cn(
        "flex size-9 items-center justify-center rounded-full bg-paper/90 text-ink shadow-sm backdrop-blur transition-opacity duration-200",
        /* Visible au survol seulement — une grille sert à comparer des œuvres,
           pas à afficher 39 commandes. Sauf s'il est déjà actif : on ne verrait
           sinon pas ses propres favoris en parcourant la collection. */
        isFavorite
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
      )
    : "inline-flex items-center gap-2 text-sm transition-colors duration-200 text-ink-mute hover:text-ink";

  /**
   * Session inconnue, ce qui ne se confond pas avec « personne n'est connecté ».
   * Le signet renvoyait vers la connexion dès que la session était inconnue :
   * une visiteuse connectée cliquait et atterrissait sur le formulaire. Tant
   * qu'on ne sait pas, le bouton ne fait donc rien.
   */
  if (isPending) {
    return (
      <span
        aria-hidden="true"
        className={cn(shape, "pointer-events-none", className)}
      >
        <BookmarkIcon filled={false} />
        {!isIcon && <span>Ajouter à ma collection</span>}
      </span>
    );
  }

  if (!session) {
    /**
     * Le lien emporte l'intention : d'où l'on part, et sur quelle œuvre on
     * venait de cliquer. Sans ça on se connectait et on ressortait dans « Ma
     * collection » sans l'œuvre. `lib/auth-actions.ts` les relit à la sortie.
     *
     * `usePathname` seul : lire `useSearchParams` obligerait à envelopper ce
     * bouton d'un `<Suspense>` partout, sinon le build échoue sur une page
     * pré-générée. On perd les filtres en cours, ce qui vaut mieux que ne pas
     * revenir du tout.
     */
    const target = `/connexion?retour=${encodeURIComponent(pathname)}&oeuvre=${encodeURIComponent(slug)}`;

    return (
      <Link
        href={target}
        /**
         * `next/link` précharge toute destination entrant dans le viewport. Ici
         * l'adresse contient le slug : sur `/collection` ce sont 39 adresses
         * différentes, donc 39 préchargements de la page de connexion d'un coup.
         * C'est ce qui rendait l'arrivée sur `/connexion` anormalement lente.
         */
        prefetch={false}
        aria-label={`Connectez-vous pour ajouter « ${title} » à votre collection`}
        className={cn(shape, className)}
      >
        <BookmarkIcon filled={false} />
        {!isIcon && <span>Ajouter à ma collection</span>}
      </Link>
    );
  }

  /* Connectée, mais la liste des œuvres mises de côté n'est pas encore revenue. */
  const isReady = slugs !== null;

  async function toggle() {
    const next = !isFavorite;

    setLocal(slug, next);

    /* Couvre les deux échecs : le refus renvoyé par l'action (session expirée,
       base injoignable) et la requête qui n'aboutit pas (réseau coupé). */
    try {
      const { ok } = await setFavoriteAction(slug, next);
      if (!ok) setLocal(slug, !next);
    } catch {
      setLocal(slug, !next);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!isReady}
      /* `aria-pressed` plutôt que deux libellés contradictoires : le bouton
         garde son nom, son état est annoncé à part. */
      aria-pressed={isFavorite}
      aria-label={`${title} — ${isFavorite ? "retirer de ma collection" : "ajouter à ma collection"}`}
      className={cn(shape, "disabled:cursor-default", className)}
    >
      <BookmarkIcon filled={isFavorite} />
      {!isIcon && (
        <span>
          {isFavorite ? "Dans ma collection" : "Ajouter à ma collection"}
        </span>
      )}
    </button>
  );
}

/**
 * Un signet, et non un cœur : le vocabulaire graphique du site est géométrique,
 * et le musée dit « je mets de côté » plutôt que « j'aime ».
 *
 * Le remplissage porte tout l'état, aucun changement de couleur.
 */
function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="miter"
      aria-hidden="true"
      className="size-5"
    >
      <path d="M6 3.75h12v16.5l-6-5-6 5Z" />
    </svg>
  );
}
