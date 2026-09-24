"use client";

import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { cn } from "@/lib/cn";
import type { MediaItem } from "@/types/media";

interface MediaProps {
  /** `null` : le cadre de remplacement prend le relais. */
  item: MediaItem | null;
  /** Obligatoire si le média n'a pas de dimensions connues. */
  ratio?: "square" | "portrait" | "landscape" | "wide" | "banner";
  /**
   * `cover` remplit et rogne, `contain` montre l'œuvre entière quitte à laisser
   * du vide. Une reproduction se regarde en `contain` : rogner un tableau, c'est
   * le mutiler.
   */
  fit?: "cover" | "contain";
  /**
   * Où le média se place dans son cadre, utile dans les deux modes : en `cover`
   * `top` choisit ce qu'on garde (le visage est dans le tiers haut d'un
   * portrait), en `contain` il aligne toutes les œuvres d'une grille sur une
   * même ligne haute.
   *
   * `bottom` pour la minorité d'œuvres dont le sujet est bas. Le choix ne peut
   * pas être automatique : l'API ne décrit pas la composition.
   */
  position?: "center" | "top" | "bottom";
  /**
   * `full` : le cadre prend toute la hauteur du parent et le média s'y inscrit.
   *
   * Sans cette prop, une image dont on connaît les dimensions est rendue dans le
   * flux et sa hauteur pousse le parent, alors qu'une image distante passe en
   * `fill` et ne pousse rien — le même code produisait deux mises en page
   * opposées selon l'origine de l'image.
   */
  height?: "auto" | "full";
  /** À réserver au visuel visible au-dessus de la ligne de flottaison. */
  priority?: boolean;
  /** Indice de largeur affichée, pour que next/image serve le bon fichier. */
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
  /* À n'utiliser qu'avec `position="top"`, sinon la troncature prend le milieu
     du tableau et perd le sujet. */
  banner: "aspect-[21/9]",
};

/**
 * Tentatives avant d'afficher le cadre de remplacement. Filet contre les échecs
 * passagers, pas contre les 429 de Wikimedia : même à cinq tentatives sur
 * quinze secondes, trois à cinq œuvres tombaient encore. Voir `unoptimized`.
 */
const MAX_ATTEMPTS = 5;

/**
 * Environ 1 s, 2 s, 4 s, puis 8 s. L'aléa évite que les 39 images d'une grille
 * réessaient à la même milliseconde et reproduisent la rafale qui a échoué.
 */
function retryDelay(attempt: number): number {
  return 1000 * 2 ** attempt + Math.random() * 1000;
}

/**
 * Affiche un média, image ou vidéo, derrière une seule interface : c'est la
 * donnée qui décide via sa propriété `type`.
 *
 * Deux modes selon que la donnée connaît ses dimensions : transmises, next/image
 * réserve lui-même la place ; inconnues, mode `fill` et c'est `ratio` qui la
 * réserve.
 *
 * `item.unoptimized` contourne l'optimiseur pour les images de Wikimedia :
 * next/image ne redimensionne pas chez l'hébergeur, il TÉLÉCHARGE le fichier
 * pour le retailler. Sur la page Collection, 39 téléchargements simultanés
 * depuis une seule IP, que Wikimedia refuse en 429 (mesuré : 24 erreurs à
 * froid). Ces URL désignent déjà une vignette à la bonne largeur, donc
 * l'optimiseur n'apportait presque rien. Après correction : 39 sur 39.
 *
 * Composant client alors que presque tout le site est serveur : une URL peut
 * pointer un fichier disparu, et seul le navigateur l'apprend, en échouant. Il
 * reste une feuille de l'arbre, il n'entraîne aucun parent.
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

  /* Si le composant disparaît pendant l'attente, le timer doit mourir avec lui. */
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

  /* En hauteur imposée, on passe en `fill` même quand les dimensions sont
     connues : les transmettre ferait imposer la hauteur de l'image au cadre.
     Rien n'est perdu, la place est déjà réservée par la mise en page.

     `key={attempt}` force React à remplacer l'élément : sans ça il réutilise le
     même <img>, qui ne relance aucune requête. */
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
