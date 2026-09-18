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
       * Uniquement sur le variant bouton, et c'est volontaire : un LIEN désactivé
       * n'existe pas en HTML. Quand une navigation doit être impossible, on
       * n'affiche pas le lien.
       */
      disabled?: boolean;
    });

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-soft",
  secondary: "border border-line bg-surface text-ink hover:border-ink",
  ghost:
    "text-ink underline decoration-line underline-offset-4 hover:decoration-ink",
  /* Le `primary` retourné, pour les fonds sombres (Section tone="ink", Header).
     Un `primary` y serait noir sur noir : le bouton disparaîtrait.

     Il redéfinit aussi son état désactivé, et ce n'est pas du zèle. L'état
     commun plus bas repose sur `opacity-40` : sur fond clair, un bouton sombre
     à 40 % reste lisible, tandis que sur fond noir il s'efface presque
     entièrement — et son texte foncé avec lui. On remonte donc l'opacité à 1
     et on exprime le « désactivé » par un aplat plus discret. */
  inverse:
    "bg-paper text-ink hover:bg-paper/85 disabled:bg-paper/20 disabled:text-paper/50 disabled:opacity-100 disabled:hover:bg-paper/20",
  /* UN VARIANT POUR UNE SEULE ACTION : la suppression de compte, la seule chose
     irréversible du site. Il est déclaré ici et non écrit sur place en
     `className` parce qu'une couleur est une décision de design, et que la règle
     du projet veut qu'aucune ne soit prise dans un composant.

     `danger-deep` et non `danger` : ce bouton est posé sur le papier du site.
     Les deux tokens existent précisément pour ça, voir `globals.css`.

     Il ne sert PAS à toute action destructrice — vider le panier reste un
     `secondary`. Peindre en rouge ce qui se défait d'un clic userait la couleur
     avant le jour où elle doit vraiment arrêter la main. */
  danger: "bg-danger-deep text-paper hover:bg-danger-deep/90",
  /* LE PREMIER DES DEUX TEMPS de la suppression de compte : celui qui ouvre la
     question, pas celui qui l'exécute. Au repos c'est un `secondary` ordinaire —
     il n'efface encore rien, et un rouge permanent au bas des réglages ferait
     peur à qui vient simplement changer son mot de passe. Le rouge n'apparaît
     qu'au SURVOL, c'est-à-dire au moment où la main s'y pose : il prévient de ce
     qui vient, avant le clic.

     Le second temps, lui, est plein (`danger`). Les deux ne peuvent donc pas se
     confondre, et c'est ce qui compte : si le même rouge servait aux deux, plus
     rien ne dirait lequel est le point de non-retour. */
  "danger-outline":
    "border border-line bg-surface text-ink hover:border-danger-deep hover:text-danger-deep",
};

/* DEUX TAILLES TRÈS PROCHES, ET C'EST VOULU. Le bouton du site est discret :
   sur un site dont la règle est de laisser l'œuvre porter le design, un bouton
   de 48 px de haut en texte courant pèse autant qu'un titre. Le `md` a donc été
   redescendu à 44 px et son libellé à `text-sm` — il reste la cible la plus
   grande de la page sans en devenir le premier élément qu'on regarde.

   Le `sm` n'est pas « le même en plus petit » : sa hauteur est calée sur celle
   des champs de `ui/Field` (`h-10`), pour qu'un bouton posé au bout d'une ligne
   de formulaire s'aligne dessus. Ne pas le toucher sans regarder Field. */
const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
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
    /* L'opacité et le curseur sont communs à tous les variants ; la couleur de
       survol, elle, est portée par chacun d'eux (voir plus haut). */
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
