"use client";

import gsap from "gsap";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Frame } from "@/components/ui/Frame";
import { Heading } from "@/components/ui/Heading";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/cn";
import type { ArtworkPreview } from "@/types/artwork";

interface SelectionProps {
  artworks: ArtworkPreview[];
  eyebrow?: string;
  title: string;
  /** Œuvre montrée à l'arrivée. */
  defaultIndex?: number;
  /** Lien de sortie vers le catalogue complet. */
  action?: { label: string; href: string };
}

/**
 * Sélection d'œuvres : un index à gauche, la reproduction et son cartel à droite.
 *
 * POURQUOI CETTE FORME plutôt qu'un bandeau d'images côte à côte. Un musée ne
 * montre jamais une œuvre sans la nommer : le cartel — titre, artiste, date,
 * mouvement — fait partie de l'accrochage. Un bandeau de vignettes rognées
 * donnait six timbres-poste anonymes ; ici on montre UNE œuvre à la fois, en
 * entier, et l'index dit d'avance ce qu'on va voir. C'est aussi ce qui met en
 * avant le `movement`, la ligne éditoriale du site, au lieu de l'enterrer.
 *
 * Le survol d'une ligne change l'œuvre affichée, le clic ouvre sa fiche. Le
 * survol ne CACHE donc rien : tout est déjà lisible sans lui, il ne fait
 * qu'illustrer. C'est la différence avec l'accordéon précédent, où il fallait
 * survoler pour savoir ce qu'on regardait.
 *
 * POURQUOI CE COMPOSANT EST CLIENT : il tient un état (l'œuvre montrée) et
 * écoute le survol et le focus. La page d'accueil, elle, reste un Server
 * Component — elle se contente d'importer cette section.
 *
 * GSAP plutôt qu'une transition CSS : le fondu enchaîné doit pouvoir être
 * INTERROMPU proprement quand on balaie l'index à la souris. `overwrite: "auto"`
 * tue la tween en cours sur la même propriété ; une transition CSS, elle,
 * repartirait de sa position courante avec sa durée pleine et l'ancienne œuvre
 * resterait visible sous la nouvelle.
 */
export function Selection({
  artworks,
  eyebrow,
  title,
  defaultIndex = 0,
  action,
}: SelectionProps) {
  const [active, setActive] = useState(defaultIndex);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const captionRef = useRef<HTMLElement>(null);
  /* Le premier passage doit POSER l'état, pas l'animer : sans ce drapeau, la
     première œuvre apparaîtrait en fondu au chargement de la page, après le
     rendu serveur. */
  const firstRunRef = useRef(true);

  useEffect(() => {
    const slides = slideRefs.current;
    if (!slides.length) return;

    /* Lu ici et non au rendu : `window` n'existe pas sur le serveur, et une
       lecture au rendu produirait un HTML serveur différent du HTML client. */
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const duration = firstRunRef.current || prefersReduced ? 0 : 0.45;

    slides.forEach((slide, i) => {
      if (!slide) return;
      gsap.to(slide, {
        /* `autoAlpha` et non `opacity` : il pose aussi `visibility`, donc
           l'œuvre masquée sort de l'arbre d'accessibilité et ne capte plus le
           clic. Une image à `opacity: 0` reste cliquable. */
        autoAlpha: i === active ? 1 : 0,
        /* Le léger recul des images sortantes donne sa profondeur au fondu :
           sans lui, deux reproductions qui se croisent à la même échelle
           ressemblent à un clignotement. */
        scale: i === active ? 1 : 1.02,
        duration,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    if (captionRef.current && !firstRunRef.current) {
      gsap.fromTo(
        captionRef.current,
        { opacity: 0, y: "0.5rem" },
        {
          opacity: 1,
          y: 0,
          duration: prefersReduced ? 0 : 0.35,
          ease: "power2.out",
          overwrite: "auto",
        },
      );
    }

    firstRunRef.current = false;
  }, [active]);

  /* Aucune œuvre : on n'affiche pas une vitrine vide. */
  if (artworks.length === 0) return null;

  const current = artworks[Math.min(active, artworks.length - 1)];

  return (
    <Section tone="ink" height="screen" spacing="compact">
      <div className="flex min-h-0 flex-1 flex-col gap-10">
        <div className="flex items-end justify-between gap-8">
          <div className="space-y-3">
            {eyebrow && (
              <p className="font-medium text-paper/50 text-xs uppercase tracking-[0.2em]">
                {eyebrow}
              </p>
            )}
            {/* Heading fixe `text-ink` dans ses propres classes : sur fond sombre
                il faut le surcharger explicitement, l'héritage ne suffit pas. */}
            <Heading as="h2" className="text-paper">
              {title}
            </Heading>
          </div>

          {action && (
            <Link
              href={action.href}
              className="whitespace-nowrap text-paper/70 text-sm underline decoration-paper/30 underline-offset-4 transition-colors hover:text-paper hover:decoration-paper"
            >
              {action.label}
            </Link>
          )}
        </div>

        {/* `min-h-0` autorise la ligne à RÉTRÉCIR sous la taille de son contenu :
            un élément flex refuse de passer sous sa taille intrinsèque par
            défaut, et la reproduction déborderait de l'écran au lieu de se
            contenter de la place restante. */}
        <div className="grid min-h-0 flex-1 grid-cols-[0.85fr_1fr] items-stretch gap-20">
          {/* COMBIEN DE LIGNES CET INDEX PEUT-IL TENIR : quatre, cinq au
              maximum. C'est LUI qui décide si le bloc rentre dans l'écran, et il
              faut comprendre pourquoi avant d'en ajouter une.

              Le rem du site est indexé sur la LARGEUR du viewport (voir
              globals.css). Sur un écran large mais court — un 1920×1080 avec sa
              barre d'onglets, le cas le plus courant — chaque ligne mesure donc
              un tiers de plus que sur la maquette 1440, alors que la hauteur
              disponible, elle, a diminué. Le pire cas n'est pas le petit écran :
              c'est l'écran large et bas.

              La reproduction, elle, se laisse comprimer (`min-h-0` + `flex-1`) :
              elle rétrécit jusqu'à devenir minuscule avant que quoi que ce soit
              déborde. L'index, non — une ligne fait la hauteur de son texte, un
              point c'est tout. Six lignes suffisaient à pousser le bloc hors de
              l'écran. */}
          <ol className="flex min-h-0 flex-col justify-center">
            {artworks.map((artwork, i) => {
              const isActive = i === active;
              return (
                <li
                  key={artwork.slug}
                  className="border-paper/15 border-b first:border-t"
                >
                  <Link
                    href={`/collection/${artwork.slug}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "flex items-baseline gap-6 py-3 no-underline transition-colors duration-300",
                      isActive ? "text-paper" : "text-paper/45",
                    )}
                  >
                    {/* Le numéro d'accrochage : il donne un ordre de parcours,
                        comme les cartels numérotés d'une salle. */}
                    <span className="font-display text-lead tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-xl">
                        {artwork.title}
                      </span>
                      <span className="mt-1 block truncate text-sm">
                        {[artwork.artist, artwork.movement]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>

                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex-none text-lead transition-opacity duration-300",
                        isActive ? "opacity-100" : "opacity-0",
                      )}
                    >
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>

          <figure className="flex min-h-0 flex-col gap-6">
            <Frame tone="ink" className="min-h-0 flex-1">
              {artworks.map((artwork, i) => (
                /* <div> et non <span> : <Media /> rend un <div>, qu'un <span>
                   ne peut pas contenir sans produire du HTML invalide. */
                <div
                  key={artwork.slug}
                  ref={(el) => {
                    slideRefs.current[i] = el;
                  }}
                  /* Empilées, et non montées/démontées : c'est ce qui permet de
                     faire se croiser deux reproductions. Toutes sont donc
                     chargées d'entrée — compromis assumé pour que le survol
                     n'ouvre jamais sur un cadre vide, et deuxième raison de
                     tenir la sélection courte (voir le commentaire de l'index). */
                  className={cn(
                    "absolute inset-0",
                    i === defaultIndex ? "opacity-100" : "opacity-0",
                  )}
                >
                  {/* `contain` : une reproduction se regarde entière. Le cadre
                      est plus large que la plupart des toiles, le vide se
                      répartit sur les côtés — c'est ce que fait une cimaise. */}
                  <Media
                    item={artwork.media}
                    fit="contain"
                    height="full"
                    sizes="45vw"
                    priority={i === defaultIndex}
                    fallbackLabel="Reproduction indisponible"
                  />
                </div>
              ))}
            </Frame>

            {/* LE CARTEL. Même hiérarchie que sur un mur de musée : l'œuvre, puis
                l'artiste, et la datation renvoyée à droite. */}
            <figcaption
              ref={captionRef}
              className="flex items-baseline justify-between gap-8 border-paper/15 border-t pt-4"
            >
              <span className="min-w-0">
                <span className="block truncate font-display text-lead text-paper">
                  {current.title}
                </span>
                <span className="mt-1 block truncate text-paper/50 text-sm">
                  {current.artist ?? "Artiste inconnu"}
                </span>
              </span>

              <span className="whitespace-nowrap text-paper/50 text-sm">
                {[current.year, current.movement].filter(Boolean).join(" · ")}
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </Section>
  );
}
