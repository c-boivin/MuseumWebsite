"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  const toneClass = {
    paper: { active: "text-ink", idle: "text-ink-soft hover:text-ink" },
    ink: { active: "text-paper", idle: "text-paper/80 hover:text-paper" },
  }[tone];

  return (
    <ul className={className}>
      {links.map((link) => {
        const isActive =
          pathname === link.href || pathname.startsWith(`${link.href}/`);

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
