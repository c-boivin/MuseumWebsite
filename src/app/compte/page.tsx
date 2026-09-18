import { redirect } from "next/navigation";

/**
 * `/compte` n'est pas une page, c'est une porte.
 *
 * ── POURQUOI L'ESPACE COMPTE N'A PLUS D'ACCUEIL ──
 * Les favoris vivaient ici, à la racine. L'URL disait `/compte` là où le menu et
 * le titre de la page disaient « Ma collection » — et `/compte/parametres`
 * disait « Mon profil ». Aucune des deux adresses ne nommait ce qu'elle
 * affichait. Ce n'est pas un détail de confort : une URL est ce qu'on met en
 * favori, ce qu'on partage et ce qu'on lit dans la barre d'adresse pour savoir
 * où l'on est. Chaque page de l'espace porte donc désormais son nom —
 * `/compte/collection` et `/compte/profil` — et ce segment-ci ne fait plus que
 * renvoyer vers la première.
 *
 * ── LA REDIRECTION N'EST PAS UNE COMPATIBILITÉ ASCENDANTE, ELLE SERT ──
 * `/compte` reste une adresse que l'on tape, que l'on a pu mettre en favori
 * quand elle affichait la collection, et vers laquelle pointe le bouton du menu
 * de compte dans le header. Elle doit donc mener quelque part.
 *
 * ── ELLE NE VÉRIFIE RIEN ──
 * Pas de `requireUser()` ici : le layout de ce segment le fait déjà, et il
 * s'exécute avant cette page. Le redoubler n'ajouterait qu'une lecture de
 * session de plus. Un visiteur sans compte est donc renvoyé vers `/connexion`
 * par le layout, jamais vers une collection qu'il ne peut pas voir.
 */
export default function AccountIndexPage() {
  redirect("/compte/collection");
}
