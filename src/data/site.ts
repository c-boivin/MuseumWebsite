/**
 * Identité du site. Centralisée ici : header, footer, métadonnées SEO et Open
 * Graph consomment tous ces valeurs.
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
  /**
   * Horaires en deux écritures de la même vérité : `days` / `hours` pour le
   * Footer, `schedule` pour les données structurées — c'est ce qui permet à
   * Google d'afficher « Ouvert · ferme à 18h ».
   *
   * ⚠️ Les deux se modifient ensemble, et elles sont côte à côte pour ça : un
   * horaire changé d'un seul côté donnerait un site et un moteur de recherche
   * qui annoncent deux heures différentes.
   *
   * La traduction n'est pas littérale : l'affichage dit « Mardi — Dimanche »
   * puis corrige avec la nocturne du jeudi, là où une machine veut des plages
   * qui ne se recouvrent pas.
   *
   * `schedule: null` un jour de fermeture — schema.org ne déclare que
   * l'ouverture. Le champ est écrit quand même pour que toutes les entrées aient
   * la même forme, sans quoi TypeScript refuse de lire `schedule` sur la liste.
   */
  openingHours: [
    {
      days: "Mardi — Dimanche",
      hours: "10h00 — 18h00",
      schedule: {
        dayOfWeek: ["Tuesday", "Wednesday", "Friday", "Saturday", "Sunday"],
        opens: "10:00",
        closes: "18:00",
      },
    },
    {
      days: "Nocturne le jeudi",
      hours: "10h00 — 21h30",
      schedule: {
        dayOfWeek: ["Thursday"],
        opens: "10:00",
        closes: "21:30",
      },
    },
    { days: "Lundi", hours: "Fermé", schedule: null },
  ],

  /**
   * Une date et non un nombre d'années : « 48 ans » écrit ici serait faux au 1er
   * janvier suivant. `lib/stats.ts` fait la soustraction.
   */
  openedIn: 1978,

  /**
   * Fréquentation annuelle moyenne, d'où est tiré le cumul affiché sur
   * l'accueil : c'est une estimation assumée, pas un compteur. Fictif, comme
   * l'adresse.
   */
  annualVisitors: 180_000,
} as const;
