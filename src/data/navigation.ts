/**
 * Navigation du site. Header et Footer lisent la même source : ajouter une page
 * quelque part = ajouter une ligne ici, et elle apparaît aux deux endroits.
 */
export interface NavLink {
  label: string;
  href: string;
  /**
   * Autres chemins qui laissent ce lien SOULIGNÉ comme page courante.
   *
   * Nécessaire dès qu'une entrée de navigation ouvre un parcours de plusieurs
   * pages qui ne sont pas sous son URL : `/inscription` et
   * `/mot-de-passe-oublie` appartiennent au même parcours que `/connexion`,
   * mais aucune n'est un sous-chemin de l'autre. Sans ce champ, on arrive sur
   * la création de compte et plus aucun repère du header n'est allumé — le
   * visiteur ne sait plus dans quelle partie du site il se trouve.
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
 * Parcours de compte. À part dans le Header, et pas dans `mainNavigation` :
 * `Collection`, `Billetterie` et `À propos` sont des salles du musée, la
 * connexion est une porte de service. `mainNavigation` alimente d'ailleurs aussi
 * le Footer, où la connexion n'a rien à faire.
 *
 * DEUX LISTES ET UNE SEULE ENTRÉE VISIBLE À LA FOIS : le Header affiche
 * « Connexion » ou « Mon compte », jamais les deux. Elles sont réunies dans un
 * objet plutôt que déclarées en deux constantes voisines pour que la question
 * « qu'affiche le header selon l'état de connexion ? » ait une seule réponse,
 * lisible d'un coup d'œil. C'est `layout/AccountLink` qui choisit, et lui seul.
 *
 * CONNECTÉ, « Mon compte » N'EST PAS UN LIEN MAIS UN BOUTON : il ouvre le menu
 * décrit par `accountMenu` plus bas. Son `href` reste renseigné, et il sert à
 * deux choses — c'est la destination du premier item du menu, et c'est lui qui
 * dit si le bouton doit porter le repère de page courante.
 */
export const accountNavigation = {
  signedOut: [
    {
      label: "Connexion",
      href: "/connexion",
      match: ["/inscription", "/mot-de-passe-oublie"],
    },
  ],
  /* Le libellé du bouton qui OUVRE le menu, pas une destination : il ne mène
     nulle part de lui-même. Son `href` sert quand même — c'est vers lui que
     pointe le premier item du menu, et c'est lui qui décide si le bouton est
     souligné comme page courante. */
  signedIn: [{ label: "Mon compte", href: "/compte" }],
} satisfies Record<string, NavLink[]>;

/**
 * Le contenu du menu déroulant du compte (`layout/AccountLink`).
 *
 * La déconnexion n'y figure PAS : ce n'est pas un lien, c'est une action, et
 * elle demande un vrai `<button>` (voir `account/SignOutButton`). Le menu
 * l'ajoute lui-même après ces entrées.
 *
 * ── « MA COLLECTION » FACE À « LA COLLECTION » ──
 * L'écho est voulu : le musée a la sienne, le visiteur se constitue la sienne.
 * C'est aussi ce qui dit, sans l'expliquer, que `/compte/collection` est la
 * page `/collection` avec un autre contenu — ce qu'elle est littéralement,
 * puisque les deux passent par `artwork/ArtworkBrowser`.
 *
 * ── CHAQUE ADRESSE NOMME CE QU'ELLE AFFICHE ──
 * Les favoris ont longtemps vécu à la racine `/compte`, et les réglages sous
 * `/compte/parametres` : l'URL ne disait donc ni « ma collection » ni « mon
 * profil ». Une adresse se met en favori, se partage et se lit dans la barre
 * pour savoir où l'on est — elle doit porter le même mot que le menu.
 *
 * Effet de bord heureux : aucune des deux n'est le préfixe de l'autre, il n'y a
 * donc plus de repère de page courante à désambiguïser.
 */
export const accountMenu: NavLink[] = [
  { label: "Ma collection", href: "/compte/collection" },
  { label: "Mon profil", href: "/compte/profil" },
];
