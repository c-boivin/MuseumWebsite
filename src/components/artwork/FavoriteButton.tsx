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
   * Titre de l'œuvre, UNIQUEMENT pour nommer le bouton.
   *
   * « Ajouter aux favoris » répété trente-neuf fois donne trente-neuf boutons
   * homonymes : un lecteur d'écran qui liste les commandes de la page n'a alors
   * aucun moyen de savoir laquelle concerne quelle toile.
   */
  title: string;
  /**
   * `icon` — une pastille posée sur une reproduction, dans une grille.
   * `labelled` — un bouton avec son texte, sur la fiche de l'œuvre qu'on regarde.
   */
  variant?: "icon" | "labelled";
  className?: string;
}

/**
 * Mettre une œuvre de côté, ou l'en retirer.
 *
 * ── TROIS ÉTATS, PAS DEUX ──
 * Aimé / pas aimé ne suffit pas : il y a aussi « on ne sait pas encore ». La
 * session et la liste des favoris arrivent toutes deux après le premier rendu
 * (voir `lib/auth-client.ts` pour pourquoi la page ne les connaît pas), et
 * afficher « pas en favori » pendant ce temps ferait clignoter le signet des
 * œuvres que le visiteur a justement mises de côté. Tant qu'on ne sait pas, le
 * bouton est inerte.
 *
 * ── UN VISITEUR SANS COMPTE VOIT UN LIEN, PAS UN BOUTON DÉSACTIVÉ ──
 * Les favoris sont réservés aux comptes. Restait à choisir ce qu'on montre aux
 * autres : rien, un bouton grisé, ou une porte. Rien laisse la fonction
 * invisible à ceux qui pourraient en vouloir. Un bouton grisé montre une
 * fonction sans dire comment y accéder — la pire des trois. Le lien vers la
 * connexion dit à la fois qu'il se passe quelque chose ici, et à quelle
 * condition. C'est aussi ce qu'il DOIT être en HTML : ça navigue, donc c'est un
 * lien, jamais un bouton (voir `ui/Button` pour la même règle).
 *
 * ── L'ÉCRAN CHANGE AVANT LE SERVEUR ──
 * Le cache local bascule au clic, l'appel part ensuite, et l'affichage revient
 * en arrière si le serveur refuse. Sans ça, chaque clic attendrait un
 * aller-retour pour changer une icône. On n'affiche pas d'indicateur de
 * chargement pendant ce temps : ce serait avouer une attente qu'on vient
 * justement de masquer.
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

  /* Deux apparences pour un même geste. L'icône est une pastille claire posée
     sur une reproduction : elle a besoin d'un fond, parce qu'un trait sombre
     sur une toile sombre disparaît. La version libellée vit sur le papier du
     site, à côté du cartel : elle reprend le ton discret du lien de retour de
     la fiche, et n'a donc ni fond ni contour. */
  const shape = isIcon
    ? cn(
        "flex size-9 items-center justify-center rounded-full bg-paper/90 text-ink shadow-sm backdrop-blur transition-opacity duration-200",
        /* Le signet ne s'affiche qu'au survol de la carte — une grille sert à
           comparer des œuvres, pas à afficher trente-neuf commandes. SAUF s'il
           est déjà actif : sans cette exception, on ne verrait pas ses propres
           favoris en parcourant la collection, ce qui est précisément à quoi
           ils servent. `focus-visible` fait la même exception au clavier, où il
           n'y a pas de survol. */
        isFavorite
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
      )
    : "inline-flex items-center gap-2 text-sm transition-colors duration-200 text-ink-mute hover:text-ink";

  /**
   * ON NE SAIT PAS ENCORE QUI REGARDE — et ce cas ne se confond PAS avec
   * « personne n'est connecté », c'est même le bug qu'il corrige.
   *
   * Le signet était un lien vers la connexion dès que la session était inconnue.
   * Le résultat se voyait : une visiteuse connectée cliquait sur le signet et
   * atterrissait sur la page de connexion. La session met un aller-retour à
   * revenir (voir `lib/auth-client.ts`), et pendant ce temps le bouton affirmait
   * quelque chose de faux — pire, il AGISSAIT dessus.
   *
   * Tant qu'on ne sait pas, il ne fait donc rien. Le header, lui, peut se
   * permettre d'afficher l'état déconnecté pendant l'attente : il ne fait
   * qu'afficher, on ne clique pas dessus par réflexe.
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
     * LE LIEN EMPORTE L'INTENTION : d'où l'on part, et sur quelle œuvre on
     * venait de cliquer.
     *
     * Sans ces deux paramètres, le parcours perdait son objet en chemin — on
     * cliquait sur le signet d'UNE œuvre précise, on se connectait, et l'on
     * ressortait dans « Ma collection » sans cette œuvre. Le clic de départ
     * n'existait plus nulle part. `lib/auth-actions.ts` les relit à la sortie du
     * formulaire : il met l'œuvre de côté, puis renvoie là d'où l'on vient.
     *
     * `usePathname` SEUL, sans les paramètres de la page courante : lire
     * `useSearchParams` ici obligerait à envelopper ce bouton d'un `<Suspense>`
     * partout où il apparaît, la fiche œuvre comprise — sinon le build échoue
     * sur une page pré-générée. On perd donc les filtres en vigueur au moment du
     * clic, et c'est le bon compromis : revenir sur la bonne page sans ses
     * filtres vaut mieux que ne pas revenir du tout.
     */
    const target = `/connexion?retour=${encodeURIComponent(pathname)}&oeuvre=${encodeURIComponent(slug)}`;

    return (
      <Link
        href={target}
        /**
         * PRÉCHARGEMENT COUPÉ, ET CE N'EST PAS UNE MICRO-OPTIMISATION.
         *
         * `next/link` précharge par défaut toute destination qui entre dans le
         * viewport. Or l'adresse ci-dessus contient le slug de l'œuvre : sur
         * `/collection`, ce ne sont pas 39 liens vers une même page, ce sont
         * **39 adresses différentes**, donc 39 préchargements de la page de
         * connexion — déclenchés d'un coup, pour une page où la plupart des
         * visiteurs n'iront jamais. Les signets sont invisibles au repos mais
         * bien présents dans le DOM, ils comptent donc tous.
         *
         * C'est ce qui rendait l'arrivée sur `/connexion` anormalement lente :
         * le réseau était occupé à précharger la même page trente-neuf fois.
         *
         * On ne perd presque rien : `/connexion` est pré-générée, elle arrive
         * vite sans préchargement, et ce lien n'est cliqué que par un visiteur
         * déconnecté qui voulait justement s'arrêter là.
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

    /* Le retour en arrière couvre les deux échecs possibles : le refus renvoyé
       par l'action (session expirée, base injoignable) et la requête qui
       n'aboutit pas du tout (réseau coupé). Dans les deux cas, l'écran doit
       cesser d'affirmer quelque chose que la base ignore. */
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
      /* `aria-pressed` et non deux libellés contradictoires : le bouton garde
         son nom, et son ÉTAT est annoncé à part. C'est la même règle que le
         bouton « afficher le mot de passe » de `ui/Field`. */
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
 * Un signet, et non un cœur.
 *
 * Le vocabulaire graphique du site est géométrique — une croix, un œil, un
 * panier, les équerres du monogramme, tous en trait de 1.5 à angles nets. Les
 * courbes d'un cœur y seraient la seule forme organique, et il dirait « j'aime »
 * là où le musée dit « je mets de côté ». Le signet est la même idée que le
 * marque-page qu'on glisse dans un catalogue d'exposition.
 *
 * Le remplissage porte tout l'état : vide, il est un contour ; actif, il est
 * plein. Aucun changement de couleur, aucun rouge — c'est la forme qui parle,
 * comme le soulignement de la page courante dans `NavLinks`.
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
