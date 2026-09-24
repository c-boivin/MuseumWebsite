import { accountMenu, mainNavigation } from "@/data/navigation";

/**
 * Nom de « salle » à inscrire dans le panneau de transition. Dans un musée, on
 * ne passe pas d'un écran à l'autre, on change de salle — et une salle a un
 * cartel de seuil.
 *
 * Le libellé est dérivé des navigations : ajouter une page dans
 * `data/navigation.ts` lui donne son nom de salle sans rien écrire ici.
 */
const NAVIGATIONS = [mainNavigation, accountMenu];

/**
 * Les salles qu'aucune navigation ne nomme.
 *
 * `/compte` est une redirection vers `/compte/collection` : elle porte le nom de
 * sa destination, sans quoi le panneau annoncerait un lieu où l'on ne reste pas.
 *
 * Les trois pages du parcours d'entrée ne peuvent pas être dérivées :
 * `accountNavigation.signedOut` ne déclare qu'« Connexion » et rattache les
 * autres par `match`, un champ qui dit « allume le même repère », pas « porte le
 * même nom ». S'en servir aurait inscrit « Connexion » sur le seuil de la
 * création de compte.
 */
const EXTRA_ROOMS: Record<string, string> = {
  "/": "Accueil",
  "/compte": "Ma collection",
  "/connexion": "Connexion",
  "/inscription": "Créer un compte",
  "/mot-de-passe-oublie": "Mot de passe oublié",
};

/**
 * Les fiches œuvres ne passent pas par ici : les liens vers une œuvre passent
 * son titre en `transitionLabel`. Ce repli ne sert qu'à un lien construit
 * ailleurs, qui ne connaîtrait pas le titre.
 *
 * Les deux préfixes correspondent aux deux adresses d'une même fiche.
 */
const ARTWORK_FALLBACK = "Œuvre";
const ARTWORK_PREFIXES = ["/collection/", "/compte/collection/"];

export function roomLabel(href: string): string {
  /* Ni la chaîne de requête ni l'ancre ne changent la salle où l'on entre. */
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "") || "/";

  /* Les correspondances exactes d'abord : sans cet ordre,
     `/compte/collection` tomberait dans le repli « Œuvre ». */
  for (const navigation of NAVIGATIONS) {
    const known = navigation.find((link) => link.href === path);
    if (known) return known.label;
  }

  if (EXTRA_ROOMS[path]) return EXTRA_ROOMS[path];

  if (ARTWORK_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return ARTWORK_FALLBACK;
  }

  /* Page inconnue : le panneau passe sans texte plutôt qu'avec un nom inventé. */
  return "";
}
