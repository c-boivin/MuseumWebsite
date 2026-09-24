/**
 * Navigation du site. Header et Footer lisent la même source : ajouter une page
 * = ajouter une ligne ici, et elle apparaît aux deux endroits.
 */
export interface NavLink {
  label: string;
  href: string;
  /**
   * Autres chemins qui laissent ce lien souligné comme page courante.
   *
   * `/inscription` et `/mot-de-passe-oublie` appartiennent au parcours de
   * `/connexion` sans être des sous-chemins. Sans ce champ, on arrive sur la
   * création de compte et plus aucun repère du header n'est allumé.
   */
  match?: string[];
}

export const mainNavigation: NavLink[] = [
  { label: "Collection", href: "/collection" },
  { label: "Billetterie", href: "/billetterie" },
  { label: "À propos", href: "/a-propos" },
];

export const footerNavigation: NavLink[] = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Accessibilité", href: "/a-propos#accessibilite" },
  { label: "Contact", href: "/a-propos#contact" },
];

/**
 * Parcours de compte, à part de `mainNavigation` : les autres entrées sont des
 * salles du musée, la connexion est une porte de service. `mainNavigation`
 * alimente aussi le Footer, où la connexion n'a rien à faire.
 *
 * Deux listes et une seule entrée visible à la fois. Réunies dans un objet pour
 * que « qu'affiche le header selon l'état de connexion ? » ait une seule
 * réponse. C'est `layout/AccountLink` qui choisit.
 */
export const accountNavigation = {
  signedOut: [
    {
      label: "Connexion",
      href: "/connexion",
      match: ["/inscription", "/mot-de-passe-oublie"],
    },
  ],
  /* Le libellé du bouton qui OUVRE le menu, pas une destination. Son `href` sert
     quand même : c'est vers lui que pointe le premier item du menu, et c'est lui
     qui décide si le bouton est souligné comme page courante. */
  signedIn: [{ label: "Mon compte", href: "/compte" }],
} satisfies Record<string, NavLink[]>;

/**
 * Le contenu du menu déroulant du compte (`layout/AccountLink`).
 *
 * La déconnexion n'y figure pas : c'est une action, elle demande un vrai
 * `<button>` (voir `account/SignOutButton`). Le menu l'ajoute lui-même après.
 *
 * L'écho entre « Ma collection » et « La collection » est voulu : il dit sans
 * l'expliquer que `/compte/collection` est `/collection` avec un autre contenu,
 * ce qu'elle est littéralement — les deux passent par `ArtworkBrowser`.
 *
 * Chaque adresse nomme ce qu'elle affiche. Les favoris vivaient à la racine
 * `/compte` et les réglages sous `/compte/parametres` : l'URL ne disait ni « ma
 * collection » ni « mon profil ». Effet de bord heureux, aucune des deux n'est
 * le préfixe de l'autre — plus de repère de page courante à désambiguïser.
 */
export const accountMenu: NavLink[] = [
  { label: "Ma collection", href: "/compte/collection" },
  { label: "Mon profil", href: "/compte/profil" },
];
