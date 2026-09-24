import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { Ticketing } from "@/components/sections/Ticketing";
import { featuredArtworks } from "@/data/featured-artworks";

export const metadata: Metadata = {
  title: "Billetterie",
  description:
    "Tarifs, options de visite et réservation en ligne du Musée des Mouvements : entrées adulte, jeune, senior, PMR, tarif groupe à partir de 10 personnes.",
  alternates: { canonical: "/billetterie" },
};

/**
 * Page Billetterie.
 *
 * Même bloc d'accroche que l'accueil et qu'À propos. La page avait d'abord un
 * en-tête sobre pour que les tarifs soient visibles sans défiler, mais la
 * billetterie était alors la seule page à ne pas s'ouvrir sur une toile, et ça
 * se voyait. Un musée qui met une grille de prix en premier écran vend des
 * billets ; un musée qui met une œuvre donne envie d'en acheter un.
 *
 * Le prix est assumé : la grille commence sous la ligne de flottaison, et le
 * bouton « Choisir ses billets » y emmène en un clic. C'est une ancre et non une
 * navigation — `TransitionLink` ne joue pas le panneau, et
 * `scroll-padding-top` cale la cible sous le header.
 *
 * Page entièrement statique : aucun appel API, seul le panier vit côté client.
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
        /* `center` comme les Tournesols d'À propos : la figure est allongée en
           travers du tableau, et le cadrage `top` par défaut ne montrerait que
           la tenture du fond. C'est aussi la seule reproduction du site en
           format paysage. */
        imagePosition="center"
        height="screen"
      />

      <Ticketing />
    </>
  );
}
