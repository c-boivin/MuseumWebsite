import { cn } from "@/lib/cn";

/**
 * Tailles disponibles, dans l'ordre de l'échelle (voir `globals.css`). Chaque
 * valeur nomme un EMPLOI, jamais une dimension : c'est ce qui permet de changer
 * le corps d'un palier sans relire tous les appels.
 */
type HeadingSize = "display" | "title" | "heading" | "subhead";

interface HeadingProps {
  children: React.ReactNode;
  /** Niveau sémantique HTML, pour l'accessibilité et le SEO. */
  as?: "h1" | "h2" | "h3";
  /** Taille visuelle, indépendante du niveau sémantique. */
  size?: HeadingSize;
  className?: string;
}

/**
 * Titre du site.
 *
 * `as` (sémantique) et `size` (visuel) sont deux props séparées : une page ne
 * doit avoir qu'un seul <h1>, mais un <h2> peut avoir besoin d'être énorme. Les
 * fusionner obligerait à casser la hiérarchie des titres pour des raisons de
 * design.
 *
 * La question n'est pas « quelle balise ? » mais « quel bloc ? » : le corps suit
 * le rôle du bloc, pas le niveau. C'est pour ça que le <h1> d'une fiche est plus
 * petit que le <h2> d'un bloc éditorial, et ce n'est pas une incohérence.
 *
 *   display   Accroche de page, une par page.
 *   title     En-tête compact, ou titre d'un bloc éditorial de l'accueil.
 *   heading   Sous-section, panneau, carte.
 *   subhead   Titre d'œuvre ou nom propre dans une liste.
 *
 * Toutes les tailles sont en serif : l'ancienne taille `subtitle` basculait en
 * sans, si bien que la signature typographique s'arrêtait aux titres de page. Le
 * sans reste la police du corps de texte.
 */
export function Heading({
  children,
  as: Tag = "h2",
  size = "title",
  className,
}: HeadingProps) {
  const sizeClass: Record<HeadingSize, string> = {
    display: "text-display",
    title: "text-title",
    heading: "text-heading",
    subhead: "text-subhead",
  };

  return (
    <Tag
      className={cn(
        "text-balance font-display text-ink",
        sizeClass[size],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
