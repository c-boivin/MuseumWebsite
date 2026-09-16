import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

interface BaseProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}

/** Si `href` est fourni, on rend un lien ; sinon un vrai bouton. */
type ButtonProps =
  | (BaseProps & { href: string; type?: never; onClick?: never })
  | (BaseProps & {
      href?: undefined;
      type?: "button" | "submit";
      /** Réservé aux Client Components : un Server Component ne peut pas en passer. */
      onClick?: () => void;
    });

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-soft",
  secondary: "border border-line bg-surface text-ink hover:border-ink",
  ghost:
    "text-ink underline decoration-line underline-offset-4 hover:decoration-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-base",
};

/**
 * Bouton du site, rendu soit en <Link>, soit en <button>.
 *
 * Pourquoi cette distinction : un élément qui NAVIGUE doit être un lien (clic
 * milieu, ouverture dans un onglet, lecteur d'écran qui annonce "lien"), un
 * élément qui DÉCLENCHE une action doit être un <button>. Un <div onClick> qui
 * ressemble à un bouton est inaccessible au clavier.
 *
 * Le typage force ce choix : on ne peut pas passer `href` et `onClick` ensemble.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const styles = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200",
    variant !== "ghost" && sizes[size],
    variants[variant],
    className,
  );

  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      className={styles}
    >
      {children}
    </button>
  );
}
