import { create } from "zustand";
import type { TicketQuantities } from "@/lib/cart";

/**
 * Étapes de la transition de page.
 *
 * Une transition de SORTIE n'est pas gratuite en Next : le routeur navigue
 * immédiatement au clic, il n'existe aucun « avant de partir » où accrocher une
 * animation. Il faut donc retarder la navigation nous-mêmes, et c'est ce que
 * décrit cette machine à trois états :
 *
 *   idle      rien en cours, le panneau est hors écran
 *   leaving   l'utilisateur a cliqué, le panneau recouvre l'écran ;
 *             `router.push` n'est appelé qu'à la FIN de cette animation
 *   entering  la nouvelle page est montée derrière le panneau, qui se retire
 *
 * Le panneau reste donc en place tant que la page suivante n'est pas prête :
 * une page lente allonge l'attente derrière le panneau au lieu de faire
 * clignoter un écran blanc.
 */
export type TransitionPhase = "idle" | "leaving" | "entering";

interface TransitionState {
  /**
   * Le preloader est-il encore à l'écran ?
   *
   * Vrai au démarrage, faux dès que l'intro s'est retirée. Il vit dans le store
   * et non dans le composant Preloader pour une raison précise : d'AUTRES
   * composants en dépendent. `TextReveal` attend cette bascule avant de révéler
   * un titre, sans quoi l'animation de la page d'accueil se jouerait derrière le
   * panneau noir et serait déjà terminée à son ouverture.
   *
   * Non persisté : un rechargement complet rejoue l'intro, une navigation
   * interne non — le root layout n'étant jamais démonté, le store survit.
   */
  isIntroRunning: boolean;
  endIntro: () => void;

  phase: TransitionPhase;
  /** Où le lien cliqué est censé nous amener. Lu par `PageTransition` au moment du `router.push`. */
  destination: string | null;
  /** Nom de la salle vers laquelle on va, inscrit dans le panneau. */
  label: string | null;

  leave: (destination: string, label: string) => void;
  arrive: () => void;
  settle: () => void;
}

export const useTransitionStore = create<TransitionState>((set, get) => ({
  isIntroRunning: true,
  endIntro: () => set({ isIntroRunning: false }),

  phase: "idle",
  destination: null,
  label: null,

  /**
   * Un second clic pendant qu'une transition est en cours est IGNORÉ, et c'est
   * le garde-fou principal de tout le mécanisme. Sans lui, un clic sur un
   * deuxième lien relancerait l'animation de sortie depuis son début alors que
   * le `router.push` du premier est déjà parti : le panneau se rouvrirait sur
   * une page qui n'est pas celle qu'il annonce, et les deux timelines
   * s'écraseraient l'une l'autre.
   */
  leave: (destination, label) => {
    if (get().phase !== "idle") return;
    set({ phase: "leaving", destination, label });
  },

  arrive: () => set({ phase: "entering" }),

  settle: () => set({ phase: "idle", destination: null, label: null }),
}));

/* ---------------------------------------------------------------------------
   Panier de la billetterie
--------------------------------------------------------------------------- */

interface CartState {
  /**
   * Quantité par catégorie de billet, indexée par l'`id` de `data/tarifs.ts`.
   * Une catégorie à 0 est RETIRÉE de l'objet plutôt que gardée à zéro : l'état
   * décrit ce qui est dans le panier, pas la grille tarifaire entière.
   */
  quantities: TicketQuantities;
  /** Identifiants des options cochées (audioguide, guide papier). */
  options: string[];

  setQuantity: (id: string, quantity: number) => void;
  toggleOption: (id: string) => void;
  clear: () => void;
}

/**
 * Le panier, second store du site.
 *
 * POURQUOI UN STORE, alors que le panier ne s'affiche que sur /billetterie et
 * qu'un `useState` suffirait à le faire fonctionner : parce qu'il ne s'affiche
 * justement pas QUE là. Le compteur du Header le lit sur toutes les pages, et
 * le Header n'est pas un ancêtre de la page dans l'arbre React — il est monté
 * par le root layout. Faire remonter l'état jusqu'à un ancêtre commun voudrait
 * dire poser un Context autour de tout le site, c'est-à-dire réécrire à la main
 * ce que Zustand fait déjà pour la transition de page juste au-dessus.
 *
 * Le panier survit donc à la navigation — le root layout n'est jamais démonté —
 * mais PAS au rechargement : il n'est pas persisté. C'est délibéré. Le
 * middleware `persist` restaurerait un panier depuis localStorage au premier
 * rendu client, alors que le serveur a rendu un panier vide, et il faudrait
 * traiter ce décalage d'hydratation sur un site qui n'encaisse aucun paiement.
 *
 * Il ne contient QUE des choix : aucun total, aucune remise. Tout le calcul est
 * dans `lib/cart.ts`, voir l'en-tête de ce fichier.
 */
export const useCartStore = create<CartState>((set) => ({
  quantities: {},
  options: [],

  setQuantity: (id, quantity) =>
    set((state) => {
      const next = { ...state.quantities };

      /* Une quantité négative n'existe pas, et `Math.floor` protège d'un appel
         malencontreux depuis un champ de saisie. */
      const value = Math.max(0, Math.floor(quantity));
      if (value === 0) delete next[id];
      else next[id] = value;

      return { quantities: next };
    }),

  toggleOption: (id) =>
    set((state) => ({
      options: state.options.includes(id)
        ? state.options.filter((option) => option !== id)
        : [...state.options, id],
    })),

  clear: () => set({ quantities: {}, options: [] }),
}));

/**
 * Nombre total de personnes dans le panier.
 *
 * Exporté comme sélecteur nommé, et pas recalculé dans chaque composant : il
 * sert au Header, au récapitulatif et au bouton de paiement. Il renvoie un
 * NOMBRE et non un objet — un sélecteur qui construirait un nouvel objet à
 * chaque appel referait rendre le composant en boucle, Zustand comparant les
 * instantanés par identité.
 */
export const selectVisitorCount = (state: CartState) =>
  Object.values(state.quantities).reduce((count, value) => count + value, 0);

/* ---------------------------------------------------------------------------
   Favoris — CACHE D'AFFICHAGE, PAS SOURCE DE VÉRITÉ
--------------------------------------------------------------------------- */

interface FavoritesState {
  /**
   * Slugs des œuvres mises de côté, du plus récent au plus ancien.
   *
   * `null` A UN SENS PROPRE : « on ne sait pas encore ». Il ne se confond pas
   * avec le tableau vide, qui veut dire « ce compte n'a aucun favori ». Sans
   * cette distinction, chaque bouton favori de la collection s'afficherait
   * comme « non aimé » pendant le chargement, y compris sur les œuvres que le
   * visiteur a justement mises de côté : il verrait son propre choix disparaître
   * puis revenir. Un bouton qui ne sait pas reste inerte, il ne ment pas.
   */
  slugs: string[] | null;

  /** Remplace tout le contenu — réponse du serveur, ou amorçage par une page. */
  load: (slugs: string[]) => void;
  /** Déconnexion : on repasse à « on ne sait pas », pas à « aucun favori ». */
  clear: () => void;
  /** Mise à jour optimiste d'une seule œuvre, avant la réponse du serveur. */
  setLocal: (slug: string, favorited: boolean) => void;
}

/**
 * Troisième store du site, et le seul qui ne détient RIEN.
 *
 * ── CE QU'IL EST ──
 * Un cache. La vérité est dans la table `favorite` de la base ; ce store en
 * garde une copie le temps d'une visite, pour deux raisons précises :
 *
 * 1. GARDER `/collection` STATIQUE. Les 39 cartes doivent savoir lesquelles sont
 *    déjà en favori. Le faire dire par le serveur voudrait dire lire la session
 *    dans la page, donc la rendre dynamique, donc perdre la pré-génération du
 *    catalogue — le contraire de ce que l'étape 3 a construit. Le cache est
 *    rempli après coup, depuis le navigateur, et la page reste pré-calculable.
 * 2. NE PAS INTERROGER LE SERVEUR 39 FOIS. Sans état partagé, chaque bouton
 *    demanderait son propre état. Un seul appel remplit les 39.
 *
 * ── IL N'EST PAS PERSISTÉ, ET C'EST LE MÊME RAISONNEMENT QUE LE PANIER ──
 * `persist` restaurerait une liste depuis `localStorage` au premier rendu client
 * alors que le serveur a rendu une page sans favoris : un écart d'hydratation à
 * traiter. Ici le problème ne se pose même pas, parce qu'il n'y a rien à
 * conserver — la base a déjà tout, et la relire coûte une requête au chargement.
 * Persister un cache dont la source est à un aller-retour de distance, ce serait
 * fabriquer un risque d'affichage périmé pour gagner 100 ms.
 *
 * ── CE QU'IL NE FAIT PAS ──
 * Il n'écrit rien en base. C'est `lib/favorites-actions.ts` qui le fait, et les
 * composants appellent les deux : le store pour que l'écran réagisse tout de
 * suite, l'action pour que ça compte vraiment.
 */
export const useFavoritesStore = create<FavoritesState>((set) => ({
  slugs: null,

  load: (slugs) => set({ slugs }),

  clear: () => set({ slugs: null }),

  setLocal: (slug, favorited) =>
    set((state) => {
      /* Rien à mettre à jour tant qu'on ne sait pas ce qu'il y avait : on
         écrirait une liste d'un seul élément par-dessus une liste inconnue, et
         toutes les autres œuvres passeraient pour non aimées. */
      if (state.slugs === null) return state;

      if (favorited) {
        if (state.slugs.includes(slug)) return state;
        /* En tête, comme le `order by` de la requête : le dernier ajout arrive
           en haut de la page des favoris sans attendre un rechargement. */
        return { slugs: [slug, ...state.slugs] };
      }

      return { slugs: state.slugs.filter((entry) => entry !== slug) };
    }),
}));
