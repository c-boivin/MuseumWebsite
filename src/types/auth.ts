/**
 * Ce qu'une soumission de formulaire de compte renvoie à l'écran.
 *
 * Le type vit ici et non dans `lib/auth-actions.ts` parce qu'il est partagé
 * entre le serveur qui le produit et le composant client qui l'affiche — et
 * surtout parce qu'un fichier `"use server"` ne doit exporter QUE des fonctions
 * asynchrones. Un type y serait effacé à la compilation, donc toléré, mais la
 * règle est plus lisible tenue strictement.
 *
 * `null` est l'état de départ : le formulaire n'a pas encore été envoyé. Une
 * soumission RÉUSSIE ne produit aucun état non plus — elle redirige, la page
 * qui l'affichait n'existe plus.
 */
export interface AuthFormMessage {
  /**
   * `error`   = l'envoi a échoué, il faut corriger quelque chose.
   * `success` = c'est fait, et la page reste affichée — les formulaires de
   *             `/compte/profil`, qui ne redirigent nulle part.
   * `notice`  = l'envoi a bien été pris en compte, mais la suite n'existe pas
   *             encore (le mot de passe oublié, qui n'a pas de service d'e-mail).
   *
   * La distinction n'est pas cosmétique : elle décide de la couleur ET du rôle
   * ARIA annoncé, donc de l'urgence avec laquelle un lecteur d'écran l'énonce.
   *
   * POURQUOI `success` EXISTE ALORS QUE LA CONNEXION N'EN A PAS BESOIN : une
   * connexion réussie redirige, la nouvelle page EST la confirmation. Un
   * changement de mot de passe, lui, laisse le visiteur devant le même
   * formulaire — sans un mot, rien ne distingue « c'est enregistré » de « le
   * bouton n'a pas marché ».
   */
  tone: "error" | "success" | "notice";
  message: string;
}

export type AuthFormState = AuthFormMessage | null;

/**
 * La signature imposée par `useActionState` : l'état précédent d'abord, les
 * données du formulaire ensuite. Les trois pages de compte partagent ce contrat,
 * c'est ce qui permet à `AuthPanel` de recevoir n'importe laquelle en prop.
 */
export type AuthAction = (
  state: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;
