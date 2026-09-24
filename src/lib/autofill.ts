/**
 * Détection du remplissage automatique du navigateur.
 *
 * Quand Chrome remplit un formulaire de connexion à l'arrivée, il l'affiche
 * rempli mais n'expose pas les valeurs au JavaScript tant que la page n'a reçu
 * aucun geste — une protection, sans laquelle n'importe quelle page pourrait
 * lire un identifiant enregistré.
 *
 * Conséquence : `input.value` vaut `""` sur un champ visiblement plein,
 * `checkValidity()` répond faux, et le bouton d'envoi reste éteint. Au premier
 * clic n'importe où, Chrome livre tout d'un coup — d'où le symptôme
 * caractéristique, cliquer dans UN champ fait réagir les DEUX.
 *
 * Aucun `setTimeout` ne résout ça, contrairement à ce qu'on lit partout : le
 * problème n'est pas que l'autofill arrive tard, c'est qu'il ne se lit pas.
 *
 * Le seul signal émis quand même est la pseudo-classe `:-webkit-autofill`, qui
 * correspond immédiatement. `globals.css` lui accroche une animation d'une
 * milliseconde, invisible, dont le seul rôle est de déclencher un
 * `animationstart`.
 */

/**
 * Nom de l'animation déclarée dans `globals.css`. Les deux doivent rester
 * identiques : rien ne le vérifie à la compilation, et le renommer d'un seul
 * côté n'affiche aucune erreur — les champs préremplis redeviennent inertes.
 */
export const AUTOFILL_ANIMATION = "field-autofilled";

/**
 * Deux sélecteurs essayés l'un après l'autre, surtout pas réunis en liste :
 * `matches(":autofill, :-webkit-autofill")` LÈVE une exception dans un
 * navigateur qui ne connaît pas l'un des deux, au lieu de l'ignorer.
 */
export function isAutofilled(input: Element): boolean {
  for (const selector of [":autofill", ":-webkit-autofill"]) {
    try {
      if (input.matches(selector)) return true;
    } catch {
      /* Pseudo-classe inconnue de ce navigateur : on passe à la suivante. */
    }
  }

  return false;
}

/**
 * Y a-t-il quelque chose dans ce champ, du point de vue de l'utilisateur ? Ce
 * n'est pas `input.value !== ""` : un champ prérempli est plein à l'écran et
 * vide pour le JavaScript.
 */
export function hasContent(input: HTMLInputElement): boolean {
  return input.value !== "" || isAutofilled(input);
}
