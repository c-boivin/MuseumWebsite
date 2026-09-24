import { create } from "zustand";
import type { TicketQuantities } from "@/lib/cart";

/**
 * Étapes de la transition de page.
 *
 * Next ne propose aucun « avant de partir » : le routeur navigue dès le clic.
 * Il faut donc retarder la navigation nous-mêmes.
 *
 *   idle      le panneau est hors écran
 *   leaving   le panneau recouvre l'écran ; `router.push` n'est appelé qu'à la
 *             fin de cette animation
 *   entering  la nouvelle page est montée derrière le panneau, qui se retire
 */
export type TransitionPhase = "idle" | "leaving" | "entering";

interface TransitionState {
  /**
   * Le preloader est-il encore à l'écran ?
   *
   * Dans le store et non dans le composant Preloader parce que d'autres
   * composants en dépendent : `TextReveal` attend cette bascule, sans quoi
   * l'animation d'accueil se jouerait derrière le panneau noir.
   */
  isIntroRunning: boolean;
  endIntro: () => void;

  phase: TransitionPhase;
  /** Où le lien cliqué mène. Lu par `PageTransition` au moment du `router.push`. */
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
   * Un second clic pendant une transition est ignoré : sinon le panneau se
   * rouvrirait sur une page qui n'est pas celle qu'il annonce, le `router.push`
   * du premier étant déjà parti.
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
   * Une catégorie à 0 est retirée de l'objet : l'état décrit ce qui est dans le
   * panier, pas la grille tarifaire entière.
   */
  quantities: TicketQuantities;
  /** Identifiants des options cochées (audioguide, guide papier). */
  options: string[];

  setQuantity: (id: string, quantity: number) => void;
  toggleOption: (id: string) => void;
  clear: () => void;
}

/**
 * Le panier.
 *
 * Un store et non un `useState` de /billetterie : le compteur du Header le lit
 * sur toutes les pages, et le Header est monté par le root layout, donc il n'est
 * pas un ancêtre de la page.
 *
 * Non persisté, délibérément : `persist` restaurerait un panier depuis
 * localStorage au premier rendu client alors que le serveur a rendu un panier
 * vide, soit un écart d'hydratation à traiter sur un site sans paiement.
 *
 * Il ne contient que des choix, aucun total : le calcul est dans `lib/cart.ts`.
 */
export const useCartStore = create<CartState>((set) => ({
  quantities: {},
  options: [],

  setQuantity: (id, quantity) =>
    set((state) => {
      const next = { ...state.quantities };

      /* `Math.floor` protège d'un appel depuis un champ de saisie. */
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
 * Renvoie un nombre et non un objet : un sélecteur qui construirait un nouvel
 * objet à chaque appel ferait rendre en boucle, Zustand comparant par identité.
 */
export const selectVisitorCount = (state: CartState) =>
  Object.values(state.quantities).reduce((count, value) => count + value, 0);

/* ---------------------------------------------------------------------------
   Favoris — cache d'affichage, pas source de vérité
--------------------------------------------------------------------------- */

interface FavoritesState {
  /**
   * Slugs des œuvres mises de côté, du plus récent au plus ancien.
   *
   * `null` veut dire « on ne sait pas encore », à ne pas confondre avec le
   * tableau vide, « ce compte n'a aucun favori ». Sans cette distinction, chaque
   * bouton s'afficherait comme non aimé pendant le chargement et le visiteur
   * verrait son propre choix disparaître puis revenir.
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
 * Cache des favoris. La vérité est dans la table `favorite`.
 *
 * Deux raisons de passer par un cache client :
 *
 * 1. Garder `/collection` statique. Lire la session dans la page la rendrait
 *    dynamique et lui ferait perdre sa pré-génération.
 * 2. Ne pas interroger le serveur 39 fois, une par bouton.
 *
 * Non persisté, comme le panier, et ici la question ne se pose même pas : la
 * base a déjà tout, la relire coûte une requête au chargement.
 *
 * Il n'écrit rien : c'est `lib/favorites-actions.ts` qui le fait. Les composants
 * appellent les deux, le store pour que l'écran réagisse tout de suite.
 */
export const useFavoritesStore = create<FavoritesState>((set) => ({
  slugs: null,

  load: (slugs) => set({ slugs }),

  clear: () => set({ slugs: null }),

  setLocal: (slug, favorited) =>
    set((state) => {
      /* Rien à mettre à jour tant qu'on ne sait pas ce qu'il y avait : on
         écrirait une liste d'un seul élément par-dessus une liste inconnue. */
      if (state.slugs === null) return state;

      if (favorited) {
        if (state.slugs.includes(slug)) return state;
        /* En tête, comme le `order by` de la requête. */
        return { slugs: [slug, ...state.slugs] };
      }

      return { slugs: state.slugs.filter((entry) => entry !== slug) };
    }),
}));
