/**
 * Grille tarifaire du musée.
 *
 * ⚠️ Les montants sont ceux du sujet, repris au centime près. Ils sont élevés
 * pour un musée français — 24 € l'entrée adulte, au-dessus du Louvre — et la
 * question a été tranchée : on ne les baisse pas, c'est une donnée notée.
 *
 * Si la décision changeait : baisser une entrée sans baisser `GROUP_PRICE`
 * viderait la remise groupe de son sens, et c'est le seul calcul métier non
 * trivial de la billetterie.
 *
 * Les prix sont des nombres et non des chaînes formatées : le panier doit
 * pouvoir les additionner. Le formatage est fait par `formatPrice`.
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
 * Dans l'ordre d'affichage : le plein tarif, puis les tarifs réduits, puis la
 * gratuité.
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
  /** Prix par personne : l'option est facturée pour tout le monde ou personne. */
  price: number;
}

/**
 * Des cases à cocher et non des quantités : le sujet les facture « par
 * personne », et six audioguides pour deux billets n'aurait aucun sens.
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
 * Le plan n'est pas une option : il est gratuit et remis à tout le monde. Dans
 * la liste ci-dessus, il donnerait une case à cocher à 0 €, donc une décision à
 * prendre pour rien.
 */
export const includedExtra =
  "Le plan du musée est remis gratuitement à l'accueil.";

/** Nombre d'entrées à partir duquel la visite est considérée comme un groupe. */
export const GROUP_THRESHOLD = 10;

/** Prix par personne appliqué aux entrées d'un groupe. */
export const GROUP_PRICE = 15;
