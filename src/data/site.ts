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
} as const;
