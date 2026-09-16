import { cn } from "@/lib/cn";
import { Container } from "./Container";

interface SectionProps {
  children: React.ReactNode;
  /** Rendu comme <section> par défaut ; passer "div" pour imbriquer sans casser la sémantique. */
  as?: "section" | "div";
  /** Densité de l'espacement vertical. */
  spacing?: "compact" | "default" | "large" | "none";
  /**
   * `screen` fait tenir le bloc dans exactement une hauteur d'écran (header
   * déduit) et centre son contenu verticalement. C'est un MINIMUM, pas un
   * plafond : un contenu trop grand fait grandir le bloc plutôt que de déborder.
   *
   * Un bloc `screen` devient aussi un point d'aimantation du scroll (voir
   * `[data-snap-section]` dans globals.css). Les deux notions ne sont pas
   * séparées en deux props parce qu'elles n'ont aucun sens l'une sans l'autre :
   * aimanter un bloc qui ne fait pas une hauteur d'écran arrêterait le scroll
   * sur une position arbitraire, et un enchaînement de blocs plein écran sans
   * aimantation est précisément le problème que l'aimantation vient régler.
   */
  height?: "auto" | "screen";
  /**
   * Fond du bloc : clair du site, blanc pour le détacher, ou sombre pour
   * l'isoler franchement du reste de la page.
   */
  tone?: "paper" | "surface" | "ink";
  /** Largeur du contenu, transmise au Container interne. */
  width?: "site" | "reading";
  /** Désactive le Container interne quand la section a besoin de toute la largeur. */
  bleed?: boolean;
  className?: string;
  id?: string;
}

/**
 * Bloc de page : gère le rythme vertical et le fond.
 *
 * C'est l'exemple type d'un composant piloté par ses props plutôt que dupliqué :
 * une seule Section couvre tous les blocs du site au lieu d'un SectionClaire,
 * SectionLarge, SectionPleineLargeur…
 */
export function Section({
  children,
  as: Tag = "section",
  spacing = "default",
  height = "auto",
  tone = "paper",
  width = "site",
  bleed = false,
  className,
  id,
}: SectionProps) {
  const spacingClass = {
    compact: "py-section-sm",
    default: "py-section",
    large: "py-section-lg",
    none: "",
  }[spacing];

  /* Le bloc devient une colonne flex, et le Container son unique élément
     extensible : c'est ce qui permet à un enfant en `flex-1` (le bandeau du
     Selection, la ligne image du Hero) de réclamer toute la hauteur restante
     après les titres, au lieu de la deviner avec une valeur en dur. */
  const isScreen = height === "screen";

  /* `text-paper` sur le ton sombre pour que le texte courant s'inverse sans que
     chaque enfant ait à le demander. Les composants qui fixent leur propre
     couleur (Heading écrit `text-ink`) doivent, eux, être surchargés à la main. */
  const toneClass = {
    paper: "bg-paper",
    surface: "bg-surface",
    ink: "bg-ink-deep text-paper",
  }[tone];

  return (
    <Tag
      id={id}
      /* Repris en CSS par `globals.css` pour inverser le contour de focus :
         un outline sombre sur fond sombre ne se voit pas. */
      data-tone={tone}
      /* Lu par globals.css, dans les deux sens : il marque ce bloc comme point
         d'arrêt, et sa seule présence dans la page y déclenche l'aimantation. */
      data-snap-section={isScreen ? "" : undefined}
      className={cn(
        spacingClass,
        toneClass,
        isScreen && "flex min-h-viewport flex-col justify-center",
        className,
      )}
    >
      {bleed ? (
        children
      ) : (
        <Container
          width={width}
          className={isScreen ? "flex min-h-0 flex-1 flex-col" : undefined}
        >
          {children}
        </Container>
      )}
    </Tag>
  );
}
