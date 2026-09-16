/**
 * Contrat d'un média affichable par le composant <Media />.
 *
 * Un seul type pour l'image et la vidéo : c'est la propriété `type` qui
 * discrimine. TypeScript appelle ça une union discriminée — si `type` vaut
 * "video", il sait que `poster` existe et que `blurDataURL` n'a pas de sens.
 */
interface MediaBase {
  src: string;
  alt: string;
  /**
   * Dimensions natives du fichier, en pixels.
   *
   * Optionnelles depuis le branchement de l'API : une image distante arrive comme
   * une simple URL, sans que personne ne connaisse sa taille. Quand elles
   * manquent, <Media /> bascule en mode `fill` et c'est le ratio du cadre qui
   * fait loi — il faut donc lui passer une prop `ratio`.
   */
  width?: number;
  height?: number;
}

export interface ImageMedia extends MediaBase {
  type: "image";
  /**
   * Court-circuite l'optimiseur d'images de Next : le fichier est servi tel quel.
   *
   * À réserver aux images qui viennent DÉJÀ d'un CDN qui les redimensionne —
   * c'est le cas des vignettes Wikimedia, qu'on demande à la largeur voulue.
   * Les faire repasser par notre optimiseur n'apporterait presque rien et
   * coûterait une requête sortante par image depuis notre serveur.
   */
  unoptimized?: boolean;
}

export interface VideoMedia extends MediaBase {
  type: "video";
  /** Image affichée avant le lancement de la vidéo. */
  poster?: string;
}

export type MediaItem = ImageMedia | VideoMedia;
