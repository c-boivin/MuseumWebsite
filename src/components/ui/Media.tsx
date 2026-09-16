"use client";

import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { cn } from "@/lib/cn";
import type { MediaItem } from "@/types/media";

interface MediaProps {
  /** `null` quand aucune reproduction n'est disponible : le cadre de remplacement prend le relais. */
  item: MediaItem | null;
  /** Cadre le média dans un ratio fixe. Obligatoire si le média n'a pas de dimensions. */
  ratio?: "square" | "portrait" | "landscape" | "wide" | "banner";
  /**
   * Cadrage dans le cadre. `cover` remplit et rogne, `contain` montre l'œuvre
   * entière quitte à laisser du vide. Une reproduction d'œuvre se regarde en
   * `contain` : rogner un tableau, c'est le mutiler.
   */
  fit?: "cover" | "contain";
  /**
   * Où le média se place dans son cadre. Utile dans les deux modes de `fit`,
   * pour deux raisons différentes :
   *
   * - en `cover`, le média est rogné et `top` choisit ce qu'on garde. Sur un
   *   cadre plus large que haut, une œuvre en portrait est forcément coupée, et
   *   la couper par le bas vaut mieux que par le milieu — dans un portrait
   *   peint, le visage est presque toujours dans le tiers haut ;
   * - en `contain`, le média est entier mais plus petit que son cadre, et `top`
   *   le colle en haut au lieu de le centrer. C'est ce qui aligne toutes les
   *   œuvres d'une grille sur une même ligne haute, quelle que soit leur
   *   orientation — le vide se reporte alors entièrement sous l'image.
   *
   * `bottom` existe pour la minorité d'œuvres dont le sujet est BAS dans la
   * composition — une nature morte posée sur une table, un premier plan chargé.
   * Le choix ne peut pas être automatique : l'API ne décrit pas la composition,
   * et le site ne connaît même pas les dimensions d'une image distante.
   */
  position?: "center" | "top" | "bottom";
  /**
   * `full` : le cadre prend TOUTE la hauteur de son parent, et le média s'y
   * inscrit — au lieu de l'inverse.
   *
   * À utiliser dès que la hauteur vient de la mise en page (une colonne de
   * grille étirée, un bloc plein écran) plutôt que d'un `ratio`. Sans cette
   * prop, une image dont on CONNAÎT les dimensions — donc toute image locale —
   * est rendue dans le flux : sa hauteur intrinsèque pousse alors le parent et
   * fait déborder le bloc. Une image distante, dont les dimensions sont
   * inconnues, passe en `fill` et ne pousse rien : le même code produisait donc
   * deux mises en page opposées selon l'origine de l'image. C'est arrivé.
   */
  height?: "auto" | "full";
  /** Charge le média en priorité — à réserver au visuel visible au-dessus de la ligne de flottaison. */
  priority?: boolean;
  /** Indice de largeur affichée, indispensable pour que next/image serve le bon fichier. */
  sizes?: string;
  /** Texte du cadre de remplacement. */
  fallbackLabel?: string;
  className?: string;
}

const ratios = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  wide: "aspect-[16/9]",
  /* Bandeau : une bande bien plus large que haute, qui assume de ne montrer
     qu'une tranche de l'œuvre. 617px de haut sur la maquette 1440, contre 1080
     pour `landscape` — de quoi tenir dans un écran sans occuper toute sa
     hauteur. À n'utiliser qu'avec `position="top"`, sinon la troncature prend le
     milieu du tableau et perd le sujet. */
  banner: "aspect-[21/9]",
};

/**
 * Nombre total de tentatives de chargement avant d'afficher le cadre de
 * remplacement.
 *
 * Filet de sécurité contre les échecs PASSAGERS : coupure réseau brève, hébergeur
 * momentanément indisponible. Sans lui, un incident d'une seconde condamnerait
 * l'image jusqu'au rechargement de la page.
 *
 * Ce n'est PAS ce qui a réglé les 429 de Wikimedia sur la page Collection : même
 * à cinq tentatives étalées sur quinze secondes, trois à cinq œuvres tombaient
 * encore. La vraie cause était notre optimiseur d'images, qui téléchargeait les
 * 39 fichiers depuis le serveur en une rafale — voir `unoptimized` plus bas.
 */
const MAX_ATTEMPTS = 5;

/**
 * Attente avant la tentative suivante : environ 1 s, 2 s, 4 s, puis 8 s.
 *
 * L'aléa n'est pas décoratif : sans lui, les 39 images d'une grille réessaieraient
 * toutes à la même milliseconde et reproduiraient la rafale qui a échoué.
 */
function retryDelay(attempt: number): number {
  return 1000 * 2 ** attempt + Math.random() * 1000;
}

/**
 * Affiche un média, image OU vidéo, derrière une seule interface.
 *
 * Toute la page appelle <Media item={...} /> sans savoir ce qu'elle affiche :
 * c'est la donnée qui décide, via sa propriété `type`. Le jour où on ajoute un
 * troisième type de média, aucune page n'est à modifier — seulement ce fichier.
 *
 * Pour les images on passe par next/image, qui redimensionne, convertit en WebP
 * et charge en lazy automatiquement. Un <img> brut perdrait tout ça.
 *
 * DEUX MODES, selon que la donnée connaît ses dimensions :
 * - image locale (width + height connus) → next/image reçoit ces dimensions et
 *   réserve lui-même la place, ce qui évite tout décalage au chargement ;
 * - image distante de l'API (dimensions inconnues) → mode `fill` : l'image occupe
 *   le cadre, et c'est la prop `ratio` qui réserve la place à sa place.
 *
 * POURQUOI CERTAINES IMAGES CONTOURNENT L'OPTIMISEUR (`item.unoptimized`) :
 * `next/image` ne redimensionne pas l'image chez l'hébergeur, il la TÉLÉCHARGE
 * depuis notre serveur pour la retailler. Sur la page Collection, ça faisait
 * partir 39 téléchargements simultanés vers Wikimedia depuis une seule adresse
 * IP — ce que Wikimedia refuse en **429**, et trois à cinq œuvres au hasard
 * s'affichaient alors sans visuel. Mesuré : 24 réponses en erreur sur un
 * chargement à froid.
 * Or ces URL désignent déjà une vignette à la largeur voulue, servie par le CDN
 * de Wikimedia : l'optimiseur n'apportait presque rien. En les servant telles
 * quelles, c'est le NAVIGATEUR qui les demande, à son rythme et en différé pour
 * celles hors écran. Mesuré après correction : 39 images sur 39, zéro erreur.
 * Les images locales, elles, continuent de passer par l'optimiseur.
 *
 * POURQUOI CE COMPOSANT EST CLIENT alors que presque tout le site est serveur :
 * une URL peut pointer un fichier disparu, ou l'hébergeur peut refuser de le
 * servir sur le moment. Le serveur n'a aucun moyen de le savoir — il ne
 * télécharge pas les images — et le navigateur, lui, l'apprend en échouant. Seul
 * un `onError` côté client permet de réessayer puis, en dernier recours, de
 * basculer sur le cadre de remplacement plutôt que de laisser une icône d'image
 * cassée. Le composant reste une feuille de l'arbre : il n'entraîne aucun parent
 * avec lui.
 */
export function Media({
  item,
  ratio,
  fit = "cover",
  position = "center",
  height = "auto",
  priority = false,
  sizes = "100vw",
  fallbackLabel,
  className,
}: MediaProps) {
  const [attempt, setAttempt] = useState(0);
  const [hasFailed, setHasFailed] = useState(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Si le composant disparaît pendant l'attente (navigation, filtre), le timer
     doit mourir avec lui : sinon React avertit d'une mise à jour sur un
     composant démonté. */
  useEffect(() => {
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  function handleError() {
    if (attempt + 1 >= MAX_ATTEMPTS) {
      setHasFailed(true);
      return;
    }
    retryTimer.current = setTimeout(
      () => setAttempt(attempt + 1),
      retryDelay(attempt),
    );
  }

  const isFullHeight = height === "full";

  const frame = cn(
    "relative overflow-hidden bg-line",
    ratio && ratios[ratio],
    isFullHeight && "h-full",
    className,
  );

  /* Pas de média, ou média qui a épuisé ses tentatives : même issue. */
  if (!item || hasFailed) {
    return (
      <div className={frame}>
        <MediaPlaceholder label={fallbackLabel} />
      </div>
    );
  }

  const objectFit = cn(
    fit === "contain" ? "object-contain" : "object-cover",
    position === "top" && "object-top",
    position === "bottom" && "object-bottom",
  );

  if (item.type === "video") {
    return (
      <div className={frame}>
        <video
          src={item.src}
          poster={item.poster}
          aria-label={item.alt}
          muted
          loop
          playsInline
          autoPlay
          onError={handleError}
          className={cn("h-full w-full", objectFit)}
        />
      </div>
    );
  }

  /* Dimensions connues : on les transmet, et next/image réserve lui-même la
     place. Sinon `fill`, qui exige un parent en `position: relative` — c'est le
     cas de `frame`.

     SAUF en hauteur imposée : là c'est le cadre qui décide, et transmettre les
     dimensions ferait exactement l'inverse — l'image imposerait sa hauteur au
     cadre. On passe donc en `fill` même quand on connaît les dimensions. Rien
     n'est perdu au passage : la place est déjà réservée par la mise en page,
     donc toujours aucun décalage au chargement.

     `key={attempt}` force React à remplacer l'élément à chaque tentative : sans
     ça, il réutiliserait le même <img>, qui ne relancerait aucune requête. */
  const hasIntrinsicSize =
    !isFullHeight && item.width !== undefined && item.height !== undefined;

  return (
    <div className={frame}>
      {hasIntrinsicSize ? (
        <NextImage
          key={attempt}
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          sizes={sizes}
          priority={priority}
          unoptimized={item.unoptimized}
          onError={handleError}
          className={cn(
            "h-full w-full",
            objectFit,
            ratio && "absolute inset-0",
          )}
        />
      ) : (
        <NextImage
          key={attempt}
          src={item.src}
          alt={item.alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={item.unoptimized}
          onError={handleError}
          className={objectFit}
        />
      )}
    </div>
  );
}
