/**
 * Ce qu'une soumission de formulaire de compte renvoie à l'écran.
 *
 * Le type vit ici et non dans `lib/auth-actions.ts` parce qu'il est partagé
 * entre le serveur qui le produit et le composant client qui l'affiche, et
 * qu'un fichier `"use server"` ne doit exporter que des fonctions asynchrones.
 *
 * `null` est l'état de départ. Une soumission réussie n'en produit aucun non
 * plus : elle redirige, la page qui l'affichait n'existe plus.
 */
export interface AuthFormMessage {
  /**
   * `error` = il faut corriger quelque chose. `success` = c'est fait et la page
   * reste affichée (les formulaires de `/compte/profil`). `notice` = l'envoi est
   * pris en compte mais la suite n'existe pas encore (le mot de passe oublié).
   *
   * La distinction décide de la couleur ET du rôle ARIA, donc de l'urgence avec
   * laquelle un lecteur d'écran l'énonce.
   *
   * `success` existe alors que la connexion n'en a pas besoin : celle-ci
   * redirige, la nouvelle page EST la confirmation. Un changement de mot de
   * passe laisse le visiteur devant le même formulaire.
   */
  tone: "error" | "success" | "notice";
  message: string;
}

export type AuthFormState = AuthFormMessage | null;

/**
 * La signature imposée par `useActionState`. Les trois pages de compte partagent
 * ce contrat, c'est ce qui permet à `AuthPanel` de recevoir n'importe laquelle
 * en prop.
 */
export type AuthAction = (
  state: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;
