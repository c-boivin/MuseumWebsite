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
   * Fond sur lequel les liens sont posés. Une classe ne suffirait pas : c'est le
   * contraste entre l'état actif et les autres qui doit s'inverser.
   */
  tone?: "paper" | "ink";
}

/**
 * Liens de navigation avec mise en évidence de la page courante.
 *
 * Client pour une seule raison : `usePathname` a besoin de savoir où est
 * l'utilisateur, ce que le serveur ignore au rendu statique. On isole ce besoin
 * dans le plus petit composant possible — le Header autour reste serveur.
 */
export function NavLinks({
  links,
  onNavigate,
  className,
  linkClassName,
  tone = "paper",
}: NavLinksProps) {
  const pathname = usePathname();

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
        /* Actif sur son propre chemin, ses sous-pages, et les chemins qu'il
           déclare rattachés (`match` dans data/navigation).

           Pas d'option « chemin exact », et ne pas en réintroduire sans
           nécessité : elle a existé le temps que « Ma collection » vive à la
           racine `/compte`, préfixe de `/compte/parametres`. Les deux pages
           portent maintenant leur propre nom, le problème a disparu avec sa
           cause. */
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
 * Soulignée et non seulement d'une autre couleur : le seul repère était un
 * passage de 80 % à 100 % d'opacité, un écart qu'on ne voit pas sans les deux
 * états côte à côte. Le soulignement est une forme, pas une nuance.
 *
 * Épaisseur et décalage en `rem`, surtout pas `decoration-2` /
 * `underline-offset-8` que les outils proposent spontanément : ceux-là valent
 * des pixels fixes et le trait s'amincirait à mesure que l'écran grandit.
 *
 * Exporté parce que le bouton du menu de compte porte le même repère sans être
 * un lien de `NavLinks` : recopier les trois classes créerait un second
 * soulignement qui se désynchronise à la première retouche.
 */
export const ACTIVE_UNDERLINE =
  "underline decoration-[0.125rem] underline-offset-[0.5rem]";
