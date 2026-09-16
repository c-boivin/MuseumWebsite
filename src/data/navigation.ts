/**
 * Navigation du site. Header et Footer lisent la même source : ajouter une page
 * quelque part = ajouter une ligne ici, et elle apparaît aux deux endroits.
 */
export interface NavLink {
  label: string;
  href: string;
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
