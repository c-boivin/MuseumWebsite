/**
 * Traduction des natures d'œuvre renvoyées par l'API.
 *
 * L'API mélange les langues : `movement` est déjà en français, `type` reste en
 * anglais. La liste des valeurs est courte et fermée, une table suffit.
 *
 * Dans `data/` et non `lib/` parce que c'est du contenu éditorial français : le
 * jour où le musée préfère « huile sur toile » à « peinture », on corrige ici.
 */
const labels: Record<string, string> = {
  painting: "Peinture",
  fresco: "Fresque",
  mural: "Peinture murale",
  triptych: "Triptyque",
  "woodblock print": "Estampe sur bois",
  drawing: "Dessin",
  sculpture: "Sculpture",
};

/**
 * Le repli sur la valeur brute est délibéré : une œuvre ajoutée demain
 * affichera « lithograph » plutôt que rien du tout.
 */
export function artworkTypeLabel(type: string): string {
  return labels[type.toLowerCase()] ?? type;
}
