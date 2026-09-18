"use client";

import { useEffect, useState } from "react";
import { TransitionLink as Link } from "@/components/motion/TransitionLink";

interface AuthLinksProps {
  links: { label: string; href: string }[];
}

/**
 * Les parcours voisins sous le formulaire : créer un compte, mot de passe
 * oublié, retour à la connexion.
 *
 * ── POURQUOI CE N'EST PAS TROIS `<Link>` ÉCRITS DANS `AuthPanel` ──
 * Parce qu'ils doivent EMPORTER LA QUESTION EN COURS. Un visiteur déconnecté qui
 * clique sur le signet d'une œuvre arrive ici avec deux paramètres dans l'URL :
 * d'où il vient, et quelle œuvre il voulait mettre de côté. S'il n'a pas encore
 * de compte, il clique sur « Créer un compte » — et sans ce composant, les deux
 * paramètres restent sur le paillasson : il s'inscrit, et ressort dans « Ma
 * collection » sans l'œuvre, c'est-à-dire exactement le parcours cassé qu'on
 * vient de réparer pour la connexion.
 *
 * ── LES ANCRES SE CONSTRUISENT APRÈS LE MONTAGE ──
 * Le serveur ne connaît pas l'URL d'une page pré-générée. Il rend donc les liens
 * nus, et le navigateur leur ajoute la question courante. Le premier rendu du
 * client est identique à celui du serveur — il n'y a pas d'écart d'hydratation,
 * seulement une mise à jour juste après. Et `/connexion` comme `/inscription`
 * restent PRÉ-GÉNÉRÉES, ce que la lecture de `searchParams` côté serveur aurait
 * coûté.
 *
 * Un lien cliqué dans l'intervalle emmène simplement vers la page voisine sans
 * la question : le visiteur retombe sur le comportement d'avant, jamais sur une
 * erreur.
 */
export function AuthLinks({ links }: AuthLinksProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch(window.location.search);
  }, []);

  return (
    <nav
      aria-label="Autres options de compte"
      className="mt-10 flex flex-col items-center gap-3 text-sm"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={`${link.href}${search}`}
          className="text-paper/60 underline decoration-paper/25 underline-offset-4 transition-colors duration-200 hover:text-paper hover:decoration-paper"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
