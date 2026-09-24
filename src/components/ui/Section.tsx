import { cn } from "@/lib/cn";
import { Container } from "./Container";

interface SectionProps {
  children: React.ReactNode;
  /** <section> par défaut ; "div" pour imbriquer sans casser la sémantique. */
  as?: "section" | "div";
  /** Densité de l'espacement vertical. */
  spacing?: "compact" | "default" | "large" | "none";
  /**
   * `screen` fait tenir le bloc dans une hauteur d'écran (header déduit) et
   * centre son contenu. C'est un minimum, pas un plafond : un contenu trop grand
   * fait grandir le bloc plutôt que de déborder.
   *
   * Un bloc `screen` était aussi un point d'aimantation du scroll. L'aimantation
   * a été retirée en branchant Lenis (voir `motion/SmoothScroll`), la prop ne
   * règle donc plus qu'une hauteur.
   */
  height?: "auto" | "screen";
  /**
   * Fond du bloc : clair du site, blanc pour le détacher, ou sombre pour
   * l'isoler franchement.
   */
  tone?: "paper" | "surface" | "ink";
  /** Largeur du contenu, transmise au Container interne. */
  width?: "site" | "reading";
  /** Désactive le Container quand la section a besoin de toute la largeur. */
  bleed?: boolean;
  className?: string;
  id?: string;
}

/**
 * Bloc de page : gère le rythme vertical et le fond.
 *
 * Exemple type d'un composant piloté par ses props plutôt que dupliqué : une
 * seule Section couvre tous les blocs du site.
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

  /* Le bloc devient une colonne flex et le Container son unique élément
     extensible : c'est ce qui permet à un enfant en `flex-1` de réclamer la
     hauteur restante après les titres, au lieu de la deviner en dur. */
  const isScreen = height === "screen";

  /* `text-paper` sur le ton sombre pour que le texte courant s'inverse sans que
     chaque enfant le demande. Les composants qui fixent leur propre couleur
     (Heading écrit `text-ink`) doivent être surchargés à la main. */
  const toneClass = {
    paper: "bg-paper",
    surface: "bg-surface",
    ink: "bg-ink-deep text-paper",
  }[tone];

  return (
    <Tag
      id={id}
      /* Repris par globals.css pour inverser le contour de focus : un outline
         sombre sur fond sombre ne se voit pas. */
      data-tone={tone}
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
