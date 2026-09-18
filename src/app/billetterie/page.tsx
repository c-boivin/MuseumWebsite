import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { Ticketing } from "@/components/sections/Ticketing";
import { featuredArtworks } from "@/data/featured-artworks";

export const metadata: Metadata = {
  title: "Billetterie",
  description:
    "Tarifs, options de visite et réservation en ligne du Musée des Mouvements : entrées adulte, jeune, senior, PMR, tarif groupe à partir de 10 personnes.",
};

/**
 * Page Billetterie.
 *
 * MÊME BLOC D'ACCROCHE QUE L'ACCUEIL ET QUE À PROPOS : plein écran, avec une
 * œuvre. La page avait d'abord un en-tête sobre, façon `/collection`, pour que
 * les tarifs soient visibles sans défiler — mais la billetterie était alors la
 * seule page du site à ne pas s'ouvrir sur une toile, et ça se voyait. Un musée
 * qui met une grille de prix en premier écran vend des billets ; un musée qui
 * met une œuvre donne envie d'en acheter un.
 *
 * Le prix à payer est assumé et connu : la grille tarifaire commence sous la
 * ligne de flottaison. Le bouton « Choisir ses billets » est là pour ça — il
 * pointe l'ancre `#tarifs` et y emmène en un clic. C'est une ancre et non une
 * navigation : `TransitionLink` laisse passer les URL qui contiennent un `#`
 * sans jouer le panneau de transition, et `scroll-padding-top` (globals.css)
 * cale la cible sous le header collant.
 *
 * Page entièrement statique : aucun appel API, aucune donnée dynamique. Next la
 * pré-rend au build, et seul le panier vit côté client.
 */
export default function TicketingPage() {
  return (
    <>
      <Hero
        eyebrow="Préparer sa visite"
        title="Billetterie"
        lead="Choisissez vos entrées et vos options, le total se met à jour au fur et à mesure. Les billets sont valables toute la journée, sans créneau imposé."
        action={{ label: "Choisir ses billets", href: "#tarifs" }}
        image={featuredArtworks.olympia}
        /* `center`, comme les Tournesols de la page À propos et pour la même
           raison : le sujet d'Olympia n'est pas en haut de la toile. La figure
           est allongée en travers du tableau, et le cadrage `top` par défaut ne
           montrerait que la tenture du fond et le haut du lit. C'est aussi la
           seule reproduction du site en format paysage : dans un cadre plein
           écran, elle est recadrée sur les côtés plutôt qu'en hauteur. */
        imagePosition="center"
        height="screen"
      />

      <Ticketing />
    </>
  );
}
