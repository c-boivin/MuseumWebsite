/**
 * Traduction des natures d'œuvre renvoyées par l'API.
 *
 * L'API mélange les langues : `movement` est déjà en français ("Surréalisme"),
 * mais `type` reste en anglais ("painting"). Afficher « painting » sous un
 * intitulé « Nature » francophone fait tache, et la liste des valeurs est courte
 * et fermée — une table de correspondance suffit.
 *
 * Elle vit dans `data/` et non dans `lib/` parce que c'est du CONTENU éditorial
 * français, au même titre que les textes du site : le jour où le musée préfère
 * « huile sur toile » à « peinture », on corrige ici sans toucher au code.
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
 * Renvoie le libellé français d'un type, ou le type brut s'il est inconnu.
 *
 * Le repli sur la valeur brute est délibéré : une œuvre ajoutée demain par l'API
 * affichera « lithograph » plutôt que rien du tout. Une information imparfaite
 * vaut mieux qu'un champ vide.
 */
export function artworkTypeLabel(type: string): string {
  return labels[type.toLowerCase()] ?? type;
}
