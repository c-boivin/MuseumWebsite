import { redirect } from "next/navigation";

/**
 * `/compte` n'est pas une page, c'est une porte.
 *
 * Les favoris vivaient ici : l'URL disait `/compte` là où le menu disait « Ma
 * collection », et `/compte/parametres` disait « Mon profil ». Aucune des deux
 * adresses ne nommait ce qu'elle affichait — et une URL est ce qu'on met en
 * favori, ce qu'on partage et ce qu'on lit pour savoir où l'on est. Chaque page
 * porte donc son nom, et ce segment ne fait plus que renvoyer vers la première.
 *
 * La redirection sert : `/compte` reste une adresse qu'on tape, qu'on a pu
 * mettre en favori, et vers laquelle pointe le bouton du menu de compte.
 *
 * Pas de `requireUser()` ici, le layout le fait déjà et s'exécute avant : un
 * visiteur sans compte est renvoyé vers `/connexion`, jamais vers une collection
 * qu'il ne peut pas voir.
 */
export default function AccountIndexPage() {
  redirect("/compte/collection");
}
