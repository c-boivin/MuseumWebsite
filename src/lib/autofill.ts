/**
 * Détection du remplissage automatique du navigateur.
 *
 * ── LE PROBLÈME, QUI N'EST PAS CELUI QU'ON CROIT ──
 * Quand Chrome remplit un formulaire de connexion à l'arrivée sur la page, il
 * l'affiche rempli mais N'EXPOSE PAS les valeurs au JavaScript tant que la page
 * n'a reçu aucun geste de l'utilisateur. C'est une protection : sans elle,
 * n'importe quelle page pourrait lire l'identifiant et le mot de passe enregistrés
 * sans que personne n'ait rien fait.
 *
 * Conséquence à l'écran, et elle est déroutante parce que tout a l'air normal :
 * `input.value` vaut `""` sur un champ visiblement plein, `form.checkValidity()`
 * répond donc faux, et le bouton d'envoi reste éteint devant un formulaire
 * complet. Au premier clic n'importe où, Chrome livre les valeurs d'un coup et
 * tout se répare — d'où le symptôme caractéristique : cliquer dans UN champ fait
 * réagir les DEUX.
 *
 * Aucun `setTimeout` ne résout ça, contrairement à ce qu'on lit partout : le
 * problème n'est pas que l'autofill arrive tard, c'est qu'il ne se lit pas.
 * Attendre plus longtemps ne fait qu'attendre plus longtemps.
 *
 * ── LE SEUL SIGNAL QUE LE NAVIGATEUR ÉMET QUAND MÊME ──
 * La pseudo-classe `:-webkit-autofill` se met à correspondre immédiatement,
 * elle. On lui accroche donc dans `globals.css` une animation d'une
 * milliseconde qui ne change rien à l'écran, uniquement pour qu'elle déclenche
 * un événement `animationstart` — le seul crochet JavaScript disponible. Le même
 * fichier CSS s'en sert déjà pour repeindre le fond bleu de Chrome : tout ce qui
 * concerne l'autofill y est rassemblé au même endroit.
 */

/**
 * Nom de l'animation déclarée dans `globals.css`.
 *
 * LES DEUX DOIVENT RESTER IDENTIQUES — c'est le seul lien entre la feuille de
 * style et le code, et rien ne le vérifie à la compilation. Le renommer d'un
 * seul côté n'affiche aucune erreur : les champs préremplis redeviennent
 * simplement inertes, exactement comme avant cette correction.
 */
export const AUTOFILL_ANIMATION = "field-autofilled";

/**
 * Ce champ est-il rempli automatiquement, valeur lisible ou non ?
 *
 * DEUX SÉLECTEURS ESSAYÉS L'UN APRÈS L'AUTRE, ET SURTOUT PAS RÉUNIS EN LISTE :
 * `matches(":autofill, :-webkit-autofill")` LÈVE une exception dans un
 * navigateur qui ne connaît pas l'une des deux, au lieu d'ignorer celle qu'il ne
 * comprend pas. Les séparer fait que chacun répond pour ce qu'il connaît —
 * `:autofill` est la forme standard, `:-webkit-autofill` celle de Chrome et
 * Safari, et Chrome accepte les deux.
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
 * Y a-t-il quelque chose dans ce champ, du point de vue de l'utilisateur ?
 *
 * C'est la question que posent les composants, et elle n'est PAS
 * `input.value !== ""` : un champ prérempli par Chrome est plein à l'écran et
 * vide pour le JavaScript. Répondre sur la seule valeur ferait disparaître la
 * croix d'effacement précisément là où elle sert le plus.
 */
export function hasContent(input: HTMLInputElement): boolean {
  return input.value !== "" || isAutofilled(input);
}
