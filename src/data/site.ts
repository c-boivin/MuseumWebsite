/**
 * Identité du site. Centralisée ici pour n'avoir qu'un seul endroit à modifier
 * (header, footer, métadonnées SEO, Open Graph consomment tous ces valeurs).
 */
export const site = {
  name: "Musée des Mouvements",
  shortName: "Musée des Mouvements",
  tagline: "La peinture racontée par ses mouvements",
  description:
    "Un musée consacré à la peinture, organisé par mouvements plutôt que par écoles : six siècles de toiles, de fresques et d'estampes, de la Renaissance italienne au surréalisme.",
  address: {
    street: "12 rue des Beaux-Arts",
    zip: "75011",
    city: "Paris",
  },
  openingHours: [
    { days: "Mardi — Dimanche", hours: "10h00 — 18h00" },
    { days: "Nocturne le jeudi", hours: "10h00 — 21h30" },
    { days: "Lundi", hours: "Fermé" },
  ],

  /**
   * Année d'ouverture au public. C'est UNE DATE et non un nombre d'années :
   * « 48 ans d'ouverture » écrit ici serait faux au 1er janvier suivant, sans
   * que personne ne pense à venir le corriger. `lib/stats.ts` fait la
   * soustraction — même principe que les chiffres du catalogue, qui sont
   * dérivés de l'API plutôt que recopiés.
   */
  openedIn: 1978,

  /**
   * Fréquentation annuelle moyenne, d'où est tiré le cumul depuis l'ouverture
   * affiché sur l'accueil. C'est donc une ESTIMATION assumée, pas un compteur :
   * un vrai musée publierait le cumul réel, qu'aucune donnée du projet ne nous
   * donne.
   *
   * Fictif, comme l'adresse ci-dessus.
   */
  annualVisitors: 180_000,
} as const;
