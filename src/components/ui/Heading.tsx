import { cn } from "@/lib/cn";

/**
 * Tailles disponibles, dans l'ordre de l'échelle (voir `globals.css`).
 * Chaque valeur nomme un EMPLOI, jamais une dimension : c'est ce qui permet de
 * changer le corps d'un palier sans avoir à relire tous les appels.
 */
type HeadingSize = "display" | "title" | "heading" | "subhead";

interface HeadingProps {
  children: React.ReactNode;
  /** Niveau sémantique HTML, pour l'accessibilité et le SEO. */
  as?: "h1" | "h2" | "h3";
  /** Taille visuelle, INDÉPENDANTE du niveau sémantique. */
  size?: HeadingSize;
  className?: string;
}

/**
 * Titre du site.
 *
 * Le point clé : `as` (sémantique) et `size` (visuel) sont deux props séparées.
 * Une page ne doit avoir qu'un seul <h1>, mais un <h2> peut avoir besoin d'être
 * énorme. Fusionner les deux notions obligerait à casser la hiérarchie des titres
 * pour des raisons de design — et à dégrader le SEO.
 *
 * QUELLE TAILLE CHOISIR : la question n'est pas « quelle balise ? » mais « quel
 * bloc ? ». Le corps suit le rôle du bloc qui entoure le titre, pas son niveau.
 * C'est pour ça que le <h1> d'une fiche œuvre est plus petit que le <h2> d'un
 * bloc éditorial de l'accueil, et ce n'est pas une incohérence.
 *
 *   display   Accroche de page — le titre par lequel une page s'ouvre, que le
 *             bloc tienne l'écran entier (`Hero height="screen"`) ou pas
 *             (/collection). Une par page.
 *   title     En-tête de page compact, ou titre d'un bloc éditorial de l'accueil.
 *   heading   Sous-section, panneau, carte — « Tarifs d'entrée », « Votre panier ».
 *   subhead   Titre d'œuvre ou nom propre dans une liste.
 *
 * TOUTES LES TAILLES SONT EN SERIF, et c'était la principale entorse à corriger :
 * l'ancienne taille `subtitle` basculait en sans + `font-medium`, si bien que la
 * signature typographique du site s'arrêtait aux titres de page et ne descendait
 * jamais dans les sections. Le sans reste la police du CORPS de texte.
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
