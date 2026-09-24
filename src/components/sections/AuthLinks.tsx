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
 * Pas trois `<Link>` écrits dans `AuthPanel`, parce qu'ils doivent emporter la
 * question en cours. Un visiteur arrivé ici depuis le signet d'une œuvre a deux
 * paramètres dans l'URL ; s'il clique sur « Créer un compte » sans ce composant,
 * ils restent sur le paillasson et il ressort dans « Ma collection » sans
 * l'œuvre — exactement le parcours cassé qu'on vient de réparer.
 *
 * Les ancres se construisent après le montage : le serveur ne connaît pas l'URL
 * d'une page pré-générée. Le premier rendu client est identique au serveur, donc
 * aucun écart d'hydratation, et `/connexion` comme `/inscription` restent
 * pré-générées — ce que la lecture de `searchParams` aurait coûté.
 *
 * Un lien cliqué dans l'intervalle emmène vers la page voisine sans la question :
 * le visiteur retombe sur le comportement d'avant, jamais sur une erreur.
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
