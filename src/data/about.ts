/**
 * Contenu éditorial de la page À propos.
 *
 * Le texte est séparé du composant : la page décrit la mise en forme, ce fichier
 * porte le contenu. On peut le relire et le corriger sans ouvrir une ligne de JSX.
 */
export const about = {
  title: "Un musée organisé par mouvements",
  lead: "Nos salles rassemblent six siècles de peinture occidentale et quelques incursions ailleurs, de la Renaissance italienne aux avant-gardes du XXe siècle.",
  metaDescription:
    "Histoire, collection, accessibilité et contact du Musée des Mouvements, consacré à six siècles de peinture occidentale.",
  /* Volontairement court : un paragraphe par chapitre, deux pour la collection.
     La page n'a pas vocation à tout dire, seulement à poser le parti pris du
     musée et à répondre aux quatre questions qu'on se pose avant de venir. */
  chapters: [
    {
      id: "histoire",
      title: "Notre histoire",
      paragraphs: [
        "Le musée est né d'un parti pris de présentation : suivre les mouvements plutôt que les écoles nationales. On passe d'un intérieur hollandais du XVIIe siècle à une toile surréaliste sans changer d'étage, dès lors que le fil du regard le justifie.",
        "Chaque salle porte le nom d'un mouvement et met une œuvre en vis-à-vis de celles qui l'ont rendue possible.",
      ],
    },
    {
      id: "collection",
      title: "La collection",
      paragraphs: [
        "Les œuvres proviennent d'une base de données publique, interrogée en direct par ce site : titre, artiste, année, mouvement et lieu de conservation viennent tous de la même source.",
        "Tout le fonds est présenté, y compris les œuvres dont aucune reproduction n'est librement consultable. Un catalogue honnête vaut mieux qu'un catalogue flatteur.",
      ],
    },
    {
      id: "accessibilite",
      title: "Accessibilité",
      paragraphs: [
        "Le bâtiment est entièrement accessible aux personnes à mobilité réduite, et des fauteuils roulants sont disponibles à l'accueil. Le site vise le niveau AA du RGAA : navigation au clavier, contrastes suffisants, description textuelle de chaque œuvre reproduite.",
      ],
    },
    {
      id: "contact",
      title: "Nous contacter",
      paragraphs: [
        "Pour la collection, les visites de groupe ou la presse : contact@musee-des-mouvements.fr. Les demandes de reproduction s'adressent aux institutions qui conservent les œuvres, indiquées sur chaque notice.",
      ],
    },
  ],
} as const;
