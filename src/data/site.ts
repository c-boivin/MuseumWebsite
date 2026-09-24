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
  /**
   * Horaires d'ouverture, en DEUX écritures de la même vérité.
   *
   * `days` / `hours` sont les libellés affichés dans le Footer. `schedule` est
   * leur jumeau lisible par une machine, consommé par les données structurées
   * (`lib/structured-data.ts`) : c'est ce qui permet à Google d'afficher
   * « Ouvert · ferme à 18h » à côté du musée, ce qu'aucun texte français ne lui
   * apprendra jamais.
   *
   * ⚠️ Les deux écritures se modifient ENSEMBLE. Elles sont côte à côte
   * exactement pour ça : un horaire changé d'un seul côté donnerait un site qui
   * annonce une heure et un moteur de recherche qui en annonce une autre.
   *
   * LA TRADUCTION N'EST PAS LITTÉRALE, et c'est normal : l'affichage dit
   * « Mardi — Dimanche » puis corrige avec une nocturne le jeudi, là où une
   * machine veut des plages qui ne se recouvrent pas. Le jeudi est donc retiré
   * de la première plage et décrit par la seconde.
   *
   * `schedule: null` sur un jour de fermeture : schema.org ne déclare que les
   * heures d'OUVERTURE, un jour fermé est un jour absent de la liste. Le champ
   * est écrit quand même, à `null`, pour que toutes les entrées aient la même
   * forme — sans quoi TypeScript refuse de lire `schedule` sur la liste.
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
