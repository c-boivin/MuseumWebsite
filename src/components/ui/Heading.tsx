import { cn } from "@/lib/cn";

interface HeadingProps {
  children: React.ReactNode;
  /** Niveau sémantique HTML, pour l'accessibilité et le SEO. */
  as?: "h1" | "h2" | "h3";
  /** Taille visuelle, INDÉPENDANTE du niveau sémantique. */
  size?: "display" | "title" | "subtitle";
  className?: string;
}

/**
 * Titre du site.
 *
 * Le point clé : `as` (sémantique) et `size` (visuel) sont deux props séparées.
 * Une page ne doit avoir qu'un seul <h1>, mais un <h2> peut avoir besoin d'être
 * énorme. Fusionner les deux notions obligerait à casser la hiérarchie des titres
 * pour des raisons de design — et à dégrader le SEO.
 */
export function Heading({
  children,
  as: Tag = "h2",
  size = "title",
  className,
}: HeadingProps) {
  const sizeClass = {
    display: "font-display text-display",
    title: "font-display text-title",
    subtitle: "text-xl font-medium tracking-tight",
  }[size];

  return (
    <Tag className={cn("text-balance text-ink", sizeClass, className)}>
      {children}
    </Tag>
  );
}
