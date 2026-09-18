import { accountMenu, mainNavigation } from "@/data/navigation";

/**
 * Nom de « salle » à inscrire dans le panneau de transition.
 *
 * Le panneau qui balaie l'écran entre deux pages porte le nom de l'endroit où
 * l'on va : c'est ce qui le distingue d'un simple volet de portfolio. Dans un
 * musée, on ne passe pas d'un écran à l'autre, on change de salle — et une
 * salle a un cartel de seuil.
 *
 * Le libellé est DÉRIVÉ des navigations du site, comme les chiffres de l'accueil
 * le sont du catalogue : ajouter une page dans `data/navigation.ts` lui donne son
 * nom de salle sans rien écrire ici. Seuls les cas qu'aucune navigation ne
 * couvre sont nommés à la main, plus bas.
 */
const NAVIGATIONS = [mainNavigation, accountMenu];

/**
 * Les salles qu'aucune navigation ne nomme.
 *
 * ── POURQUOI LES PAGES DE COMPTE ONT DÛ ÊTRE AJOUTÉES ──
 * Seule `mainNavigation` était consultée. « Ma collection » et « Mon profil »
 * n'en font pas partie — ce sont des entrées du menu de compte — et le panneau
 * passait donc SANS TEXTE sur les deux pages où l'on se rend le plus souvent une
 * fois connecté. Elles sont désormais dérivées d'`accountMenu` comme les autres ;
 * il ne reste ici que ce qui n'est l'entrée d'aucun menu.
 *
 * `/compte` n'est pas une page mais une redirection vers `/compte/collection` :
 * elle porte donc le nom de sa destination, sans quoi le panneau annoncerait un
 * lieu où l'on ne reste pas.
 *
 * Les trois pages du parcours d'entrée ne peuvent pas être dérivées non plus :
 * `accountNavigation.signedOut` ne déclare qu'« Connexion », et rattache les deux
 * autres par `match` — un champ qui dit « allume le même repère », pas « porte le
 * même nom ». S'en servir ici aurait inscrit « Connexion » sur le seuil de la
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
 * Les fiches œuvres ne passent PAS par ici : `ArtworkCard` et les autres liens
 * vers une œuvre passent le titre de l'œuvre en `transitionLabel`, ce qui est
 * infiniment plus parlant que « Œuvre ». Cette valeur ne sert que de repli, pour
 * un lien vers une fiche construit ailleurs et qui ne connaîtrait pas le titre.
 *
 * Les deux préfixes correspondent aux deux adresses d'une même fiche — celle du
 * catalogue et celle qu'on atteint depuis sa propre collection.
 */
const ARTWORK_FALLBACK = "Œuvre";
const ARTWORK_PREFIXES = ["/collection/", "/compte/collection/"];

export function roomLabel(href: string): string {
  /* On raisonne sur le chemin seul : ni la chaîne de requête (`?siecle=19`) ni
     l'ancre ne changent la salle où l'on entre. */
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "") || "/";

  /* LES CORRESPONDANCES EXACTES D'ABORD, le repli sur préfixe ensuite : sans cet
     ordre, `/compte/collection` tomberait dans le repli « Œuvre » au lieu de
     s'appeler « Ma collection ». */
  for (const navigation of NAVIGATIONS) {
    const known = navigation.find((link) => link.href === path);
    if (known) return known.label;
  }

  if (EXTRA_ROOMS[path]) return EXTRA_ROOMS[path];

  if (ARTWORK_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return ARTWORK_FALLBACK;
  }

  /* Page inconnue (mentions légales, 404…) : pas de nom inventé, le panneau
     passe sans texte plutôt qu'avec un libellé faux. */
  return "";
}
