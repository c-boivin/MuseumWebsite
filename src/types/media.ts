/**
 * Contrat d'un média affichable par <Media />.
 *
 * Un seul type pour l'image et la vidéo, `type` discrimine : une union
 * discriminée, donc si `type` vaut "video" TypeScript sait que `poster` existe.
 */
interface MediaBase {
  src: string;
  alt: string;
  /**
   * Dimensions natives en pixels. Optionnelles depuis le branchement de l'API :
   * une image distante arrive comme une simple URL. Quand elles manquent,
   * <Media /> bascule en `fill` et c'est le ratio du cadre qui fait loi.
   */
  width?: number;
  height?: number;
}

export interface ImageMedia extends MediaBase {
  type: "image";
  /**
   * Court-circuite l'optimiseur de Next. À réserver aux images qui viennent déjà
   * d'un CDN qui les redimensionne — les vignettes Wikimedia, qu'on demande à la
   * largeur voulue. Les repasser par l'optimiseur coûterait une requête sortante
   * par image pour presque rien.
   */
  unoptimized?: boolean;
}

export interface VideoMedia extends MediaBase {
  type: "video";
  /** Image affichée avant le lancement de la vidéo. */
  poster?: string;
}

export type MediaItem = ImageMedia | VideoMedia;
