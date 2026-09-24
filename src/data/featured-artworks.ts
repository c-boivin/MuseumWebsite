import type { ImageMedia } from "@/types/media";

/** Une reproduction locale : le contrat de <Media />, sans le champ `type`. */
type FeaturedImage = Omit<ImageMedia, "type">;

/**
 * Les reproductions fixes du site — celles qui illustrent un bloc éditorial et
 * ne changent jamais. Servies depuis `public/` et non demandées à l'API.
 *
 * Une précision qui change la décision : l'appel API n'est pas ce qui charge
 * l'image. Il renvoie du JSON contenant une URL Wikimedia, au build puis une
 * fois par heure ; c'est le navigateur qui va ensuite chercher le fichier.
 * Passer en local ne supprime donc pas une requête, ça change qui sert l'image.
 *
 * Et ce changement vaut pour deux raisons :
 *
 * 1. la fiabilité — Wikimedia a déjà mis ce projet en défaut deux fois
 *    (`data/image-overrides.ts`, `unoptimized`), et un visuel manquant sur
 *    l'accueil est au pire endroit possible ;
 * 2. le LCP — l'œuvre du Hero décide de la vitesse ressentie du site. Servie
 *    d'ici, elle passe par l'optimiseur de Next : AVIF ou WebP, à la taille
 *    exacte du cadre, en cache immuable.
 *
 * Le bandeau de l'accueil et la spirale d'À propos restent sur l'API : ce sont
 * des ensembles d'œuvres, des vitrines du catalogue, leur contenu doit suivre.
 *
 * Les dimensions sont renseignées parce qu'on les connaît, contrairement à une
 * image distante : next/image réserve alors la place exacte.
 *
 * Droits : œuvres du domaine public, reproductions Wikimedia également.
 */
export const featuredArtworks = {
  "the-kiss": {
    src: "/artworks/the-kiss.jpg",
    width: 1920,
    height: 1922,
    alt: "Reproduction de l'œuvre The Kiss, par Gustav Klimt",
  },
  "water-lilies": {
    src: "/artworks/water-lilies.jpg",
    width: 1920,
    height: 1845,
    alt: "Reproduction de l'œuvre Water Lilies, par Claude Monet",
  },
  "the-scream": {
    src: "/artworks/the-scream.jpg",
    width: 1920,
    height: 2383,
    alt: "Reproduction de l'œuvre The Scream, par Edvard Munch",
  },
  sunflowers: {
    src: "/artworks/sunflowers.jpg",
    width: 1920,
    height: 2423,
    alt: "Reproduction de l'œuvre Sunflowers, par Vincent van Gogh",
  },
  /* Un des deux formats paysage de la série, face à quatre portraits : d'où un
     cadrage plus délicat dans le Hero, qui recadre en `cover`. */
  olympia: {
    src: "/artworks/olympia.jpg",
    width: 1920,
    height: 1308,
    alt: "Reproduction de l'œuvre Olympia, par Édouard Manet",
  },
  /* La seule fresque de la série, en 2,2:1 : cadrée en 21/9 elle ne perd que 6 %
     de sa hauteur, là où un 16/9 lui couperait Adam d'un côté et les anges de
     l'autre. Le geste des deux mains est exactement au centre. */
  "the-creation-of-adam": {
    src: "/artworks/the-creation-of-adam.jpg",
    width: 1920,
    height: 871,
    alt: "Reproduction de l'œuvre The Creation of Adam, par Michel-Ange",
  },
} satisfies Record<string, FeaturedImage>;
