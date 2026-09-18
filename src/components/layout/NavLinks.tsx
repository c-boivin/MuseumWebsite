"use client";

import { usePathname } from "next/navigation";
import { TransitionLink as Link } from "@/components/motion/TransitionLink";
import type { NavLink } from "@/data/navigation";
import { cn } from "@/lib/cn";

interface NavLinksProps {
  links: NavLink[];
  /** Fermeture du menu mobile après un clic. */
  onNavigate?: () => void;
  className?: string;
  linkClassName?: string;
  /**
   * Fond SUR LEQUEL les liens sont posés — même vocabulaire que `Section`.
   * Il ne suffit pas de passer une classe : c'est le contraste entre l'état
   * actif et les autres qui doit s'inverser, pas seulement la couleur.
   */
  tone?: "paper" | "ink";
}

/**
 * Liens de navigation avec mise en évidence de la page courante.
 *
 * C'est un Client Component ("use client") pour une seule raison : `usePathname`
 * a besoin de savoir où est l'utilisateur, ce que le serveur ignore au moment du
 * rendu statique. On isole ce besoin dans le plus petit composant possible —
 * le Header autour, lui, reste un Server Component et n'est pas envoyé au navigateur.
 */
export function NavLinks({
  links,
  onNavigate,
  className,
  linkClassName,
  tone = "paper",
}: NavLinksProps) {
  const pathname = usePathname();

  /* Voir `ACTIVE_UNDERLINE` sous ce composant : c'est là qu'est expliqué
     pourquoi la page courante est soulignée, et pourquoi le trait s'écrit en
     `rem`. */
  const toneClass = {
    paper: {
      active: `text-ink decoration-ink ${ACTIVE_UNDERLINE}`,
      idle: "text-ink-soft hover:text-ink",
    },
    ink: {
      active: `text-paper decoration-paper ${ACTIVE_UNDERLINE}`,
      idle: "text-paper/80 hover:text-paper",
    },
  }[tone];

  return (
    <ul className={className}>
      {links.map((link) => {
        /* Le lien est actif sur son propre chemin, sur ses sous-pages
           (`/collection/mona-lisa` allume `Collection`), et sur les chemins
           qu'il déclare rattachés — voir `match` dans data/navigation.

           Il n'y a PAS d'option « chemin exact », et il ne faut pas en
           réintroduire une sans nécessité : elle a existé le temps que
           « Ma collection » vive à la racine `/compte`, préfixe de
           `/compte/parametres` — les deux entrées s'allumaient ensemble. Les
           deux pages portent maintenant leur propre nom, aucune n'est le
           préfixe de l'autre, et le problème a disparu avec sa cause. */
        const isActive = [link.href, ...(link.match ?? [])].some(
          (path) => pathname === path || pathname.startsWith(`${path}/`),
        );

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "transition-colors duration-200",
                isActive ? toneClass.active : toneClass.idle,
                linkClassName,
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Le soulignement de la page courante.
 *
 * LA PAGE COURANTE EST SOULIGNÉE, elle ne change pas seulement de couleur. Le
 * seul repère était jusqu'ici un passage de 80 % à 100 % d'opacité : un écart
 * qu'on ne voit pas sans les deux états côte à côte, et qui disparaît
 * complètement pour un œil peu sensible aux contrastes. Le soulignement, lui,
 * est une forme, pas une nuance.
 *
 * ÉPAISSEUR ET DÉCALAGE EN `rem`, et surtout PAS avec `decoration-2` /
 * `underline-offset-8`, que les outils proposent spontanément : ceux-là valent
 * des pixels FIXES, ils ne suivraient pas la typographie fluide du site et le
 * trait s'amincirait à mesure que l'écran grandit. Refuser cette suggestion fait
 * partie du contrat, elle reviendra.
 *
 * EXPORTÉ parce que le bouton du menu de compte (`layout/AccountLink`) porte le
 * même repère sans être un lien de `NavLinks` : c'est un `<button>` qui ouvre un
 * menu. Recopier les trois classes là-bas revenait à créer un second
 * soulignement qui se désynchronise à la première retouche.
 */
export const ACTIVE_UNDERLINE =
  "underline decoration-[0.125rem] underline-offset-[0.5rem]";
