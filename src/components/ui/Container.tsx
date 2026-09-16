import { cn } from "@/lib/cn";

interface ContainerProps {
  children: React.ReactNode;
  /** `site` = pleine largeur de contenu. `reading` = colonne étroite, pour du texte long. */
  width?: "site" | "reading";
  className?: string;
}

/**
 * Centre le contenu et applique les marges latérales.
 *
 * Aucune page ne gère ses marges elle-même : elles sont définies une seule fois ici.
 * Résultat, tous les blocs du site s'alignent verticalement au pixel près.
 */
export function Container({
  children,
  width = "site",
  className,
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-gutter",
        width === "site" ? "max-w-site" : "max-w-reading",
        className,
      )}
    >
      {children}
    </div>
  );
}
