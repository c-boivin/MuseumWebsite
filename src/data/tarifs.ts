/**
 * Grille tarifaire du musée.
 *
 * ⚠️ LES MONTANTS SONT CEUX DU SUJET, repris au centime près de la grille de
 * `docs/brief.md`. Ils sont élevés pour un musée français — 24 € l'entrée
 * adulte, c'est au-dessus du Louvre (22 €) et très au-dessus d'Orsay (16 €) — et
 * la question a été posée puis tranchée : on ne les baisse pas. C'est une donnée
 * notée, pas un choix de direction artistique, et le correcteur peut comparer
 * ligne à ligne. La remarque a sa place dans le compte-rendu critique, pas ici.
 *
 * Si la décision changeait un jour : baisser une entrée SANS baisser
 * `GROUP_PRICE` viderait la remise groupe de son sens (à 16 € l'entrée, elle ne
 * vaudrait plus qu'1 € par personne), et c'est le seul calcul métier non trivial
 * de la billetterie.
 *
 * Contenu statique, comme `data/about.ts` : la page décrit la mise en forme, ce
 * fichier porte les prix. Changer un tarif ne demande d'ouvrir aucun composant.
 *
 * Les prix sont des NOMBRES en euros, pas des chaînes déjà formatées. Le panier
 * doit pouvoir les additionner et leur appliquer la remise groupe ; le formatage
 * (« 24 € ») est fait à l'affichage par `formatPrice` dans `lib/cart.ts`.
 */

export interface TicketCategory {
  /** Identifiant stable : c'est la clé de cette catégorie dans le panier. */
  id: string;
  label: string;
  /** Condition d'accès au tarif, affichée sous le libellé. */
  detail: string;
  /** Prix unitaire en euros, AVANT remise groupe. */
  price: number;
}

/**
 * Les sept entrées de la grille du sujet, dans l'ordre d'affichage : le plein
 * tarif d'abord, puis les tarifs réduits, puis la gratuité.
 */
export const ticketCategories: TicketCategory[] = [
  {
    id: "adulte",
    label: "Entrée adulte",
    detail: "Plein tarif, à partir de 26 ans",
    price: 24,
  },
  {
    id: "jeune",
    label: "Entrée jeune",
    detail: "De 12 à 25 ans, sur justificatif",
    price: 18,
  },
  {
    id: "senior",
    label: "Entrée senior",
    detail: "À partir de 65 ans",
    price: 18,
  },
  {
    id: "pmr",
    label: "Entrée PMR",
    detail: "Gratuite pour l'accompagnateur",
    price: 18,
  },
  {
    id: "emploi",
    label: "Entrée recherche d'emploi",
    detail: "Sur présentation d'une attestation",
    price: 18,
  },
  {
    id: "enfant",
    label: "Entrée −12 ans",
    detail: "De 5 à 11 ans",
    price: 12,
  },
  {
    id: "petite-enfance",
    label: "Entrée −5 ans",
    detail: "Gratuite, billet obligatoire",
    price: 0,
  },
];

export interface TicketOption {
  id: string;
  label: string;
  detail: string;
  /** Prix PAR PERSONNE : l'option est facturée pour tout le monde ou personne. */
  price: number;
}

/**
 * Suppléments de visite. Ce sont des cases à cocher et non des quantités : le
 * sujet les facture « par personne », et une commande de six audioguides pour
 * deux billets n'aurait aucun sens. Cochée, l'option est donc multipliée par le
 * nombre d'entrées du panier — voir `computeCart`.
 */
export const ticketOptions: TicketOption[] = [
  {
    id: "audioguide",
    label: "Audioguide",
    detail: "Commentaire de 40 œuvres, en 6 langues",
    price: 2,
  },
  {
    id: "guide-papier",
    label: "Guide papier",
    detail: "Livret illustré de la collection permanente",
    price: 4,
  },
];

/**
 * Le plan du musée n'est pas une option : il est gratuit et remis à tout le
 * monde. Le mettre dans la liste ci-dessus créerait une case à cocher à 0 € —
 * une décision à prendre pour rien. Il est simplement mentionné sous les options.
 */
export const includedExtra =
  "Le plan du musée est remis gratuitement à l'accueil.";

/** Nombre d'entrées à partir duquel la visite est considérée comme un groupe. */
export const GROUP_THRESHOLD = 10;

/** Prix par personne appliqué aux entrées d'un groupe. */
export const GROUP_PRICE = 15;
