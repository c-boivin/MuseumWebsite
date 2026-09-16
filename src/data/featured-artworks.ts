import type { ImageMedia } from "@/types/media";

/** Une reproduction locale : le contrat de <Media />, sans le champ `type`. */
type FeaturedImage = Omit<ImageMedia, "type">;

/**
 * Les reproductions FIXES du site — celles qui illustrent un bloc éditorial et
 * ne changent jamais. Servies depuis `public/`, et non demandées à l'API.
 *
 * POURQUOI CETTE EXCEPTION, alors que tout le reste du site vient de l'API.
 *
 * D'abord, une précision qui change la décision : l'appel API n'est PAS ce qui
 * charge l'image. Il renvoie du JSON contenant une URL Wikimedia, il est fait au
 * build puis une fois par heure (ISR), et le visiteur ne le déclenche jamais.
 * C'est le NAVIGATEUR qui va ensuite chercher le fichier chez Wikimedia. Passer
 * en local ne supprime donc pas une requête API : ça change qui sert l'image.
 *
 * Et ce changement-là vaut, pour deux raisons :
 *
 * 1. LA FIABILITÉ. Wikimedia a déjà mis ce projet en défaut deux fois —
 *    `data/image-overrides.ts` n'existe que parce que deux noms de fichiers sont
 *    faux, et `unoptimized: true` que parce que Wikimedia répondait 429. Un
 *    visuel manquant sur l'accueil est au pire endroit possible.
 * 2. LE LCP. L'œuvre du Hero est l'élément le plus grand de l'écran d'arrivée,
 *    donc celui qui décide de la vitesse RESSENTIE du site. Servie par Wikimedia,
 *    c'est un JPEG non optimisé derrière un DNS et un handshake TLS
 *    supplémentaires. Servie d'ici, elle passe par l'optimiseur de Next : AVIF ou
 *    WebP, à la taille exacte du cadre, en cache immuable.
 *
 * CE QUE ÇA NE COUVRE PAS, et c'est délibéré : le bandeau de l'accueil et la
 * spirale de la page À propos restent sur l'API. Ce sont des ENSEMBLES d'œuvres,
 * des vitrines du catalogue — leur contenu doit suivre l'API, c'est tout leur
 * intérêt. Ici il ne s'agit que d'images uniques et figées.
 *
 * Les dimensions sont renseignées parce qu'on les connaît, contrairement à une
 * image distante : <Media /> les transmet à next/image, qui réserve alors la
 * place exacte et supprime tout décalage de mise en page au chargement.
 *
 * Les clés reprennent le slug de l'œuvre au catalogue : la même œuvre reste
 * consultable sur /collection/the-kiss, et le lien entre les deux se lit.
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
} satisfies Record<string, FeaturedImage>;
