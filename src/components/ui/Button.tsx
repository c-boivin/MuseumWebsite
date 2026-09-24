import { TransitionLink as Link } from "@/components/motion/TransitionLink";
import { cn } from "@/lib/cn";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "inverse"
  | "danger"
  | "danger-outline";
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
      /**
       * Uniquement sur le variant bouton : un lien désactivé n'existe pas en
       * HTML. Quand une navigation doit être impossible, on n'affiche pas le
       * lien.
       */
      disabled?: boolean;
    });

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-soft",
  secondary: "border border-line bg-surface text-ink hover:border-ink",
  ghost:
    "text-ink underline decoration-line underline-offset-4 hover:decoration-ink",
  /* Le `primary` retourné, pour les fonds sombres où il serait noir sur noir.

     Il redéfinit aussi son état désactivé : l'état commun repose sur
     `opacity-40`, or sur fond noir un bouton clair à 40 % s'efface presque
     entièrement. On remonte l'opacité à 1 et on exprime le désactivé par un
     aplat plus discret. */
  inverse:
    "bg-paper text-ink hover:bg-paper/85 disabled:bg-paper/20 disabled:text-paper/50 disabled:opacity-100 disabled:hover:bg-paper/20",
  /* Un variant pour une seule action : la suppression de compte, la seule chose
     irréversible du site. Déclaré ici et non écrit en `className` parce qu'une
     couleur est une décision de design.

     `danger-deep` et non `danger` : ce bouton est posé sur le papier du site.

     Il ne sert pas à toute action destructrice — vider le panier reste un
     `secondary`. Peindre en rouge ce qui se défait d'un clic userait la couleur
     avant le jour où elle doit vraiment arrêter la main. */
  danger: "bg-danger-deep text-paper hover:bg-danger-deep/90",
  /* Le premier des deux temps de la suppression : celui qui ouvre la question,
     pas celui qui l'exécute. Au repos c'est un `secondary` — un rouge permanent
     au bas des réglages ferait peur à qui vient changer son mot de passe. Le
     rouge n'apparaît qu'au survol, au moment où la main s'y pose.

     Le second temps est plein (`danger`) : si le même rouge servait aux deux,
     plus rien ne dirait lequel est le point de non-retour. */
  "danger-outline":
    "border border-line bg-surface text-ink hover:border-danger-deep hover:text-danger-deep",
};

/* Deux tailles très proches, et c'est voulu : sur un site dont la règle est de
   laisser l'œuvre porter le design, un bouton de 48 px en texte courant pèse
   autant qu'un titre. Le `md` est descendu à 44 px.

   Le `sm` n'est pas « le même en plus petit » : sa hauteur est calée sur celle
   des champs de `ui/Field`. Ne pas le toucher sans regarder Field. */
const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
};

/**
 * Bouton du site, rendu soit en <Link>, soit en <button>.
 *
 * Un élément qui NAVIGUE doit être un lien (clic milieu, nouvel onglet, lecteur
 * d'écran qui annonce « lien »), un élément qui DÉCLENCHE doit être un
 * <button>. Le typage force ce choix : on ne peut pas passer `href` et `onClick`
 * ensemble.
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
    /* L'opacité et le curseur sont communs à tous les variants ; la couleur de
       survol est portée par chacun d'eux. */
    "disabled:cursor-not-allowed disabled:opacity-40",
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
      disabled={props.disabled}
      className={styles}
    >
      {children}
    </button>
  );
}
