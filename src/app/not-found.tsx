import { Hero } from "@/components/sections/Hero";
import { featuredArtworks } from "@/data/featured-artworks";

/**
 * Page 404, affichée automatiquement par Next.js pour toute URL inconnue.
 *
 * Elle réutilise `Hero` au lieu de réécrire sa propre mise en page. Ce n'était
 * pas le cas avant : elle reconstruisait à la main un eyebrow, un titre, un
 * chapeau et un bouton — les quatre éléments que le Hero expose déjà en props.
 * Le jour où l'accroche du site change de rythme, cette page suivait en silence
 * ou divergeait ; maintenant elle suit forcément.
 *
 * `height="screen"` : la page ne contient que ce bloc, rien ne se trouve sous
 * lui. En hauteur libre, le pied de page remontait au milieu de l'écran.
 */
export default function NotFound() {
  return (
    <Hero
      eyebrow="Erreur 404"
      /* Titre volontairement long. « Cette salle est introuvable » tenait sur UNE
         ligne là où les accroches de l'accueil et de /a-propos en prennent deux :
         la grille en dessous récupérait la ligne économisée et donnait à l'œuvre
         une hauteur plus grande que partout ailleurs. Deux lignes ici, et les
         trois accroches du site retrouvent le même rythme.

         C'est donc une cote de mise en page déguisée en copie : si tu raccourcis
         ce titre, l'œuvre grandira. Vérifie qu'il reste sur deux lignes. */
      title="Cette salle ne figure pas au plan du musée"
      lead="La page demandée a peut-être été déplacée, ou n'a jamais existé."
      action={{ label: "Retour à l'accueil", href: "/" }}
      /* Le Cri, et non une œuvre au hasard : c'est le tableau de l'effroi, il
         commente la situation sans qu'on ait à écrire une blague dans le texte.
         Une 404 reste une page d'erreur — l'image dit ce que la copie n'a pas à
         dire. */
      image={featuredArtworks["the-scream"]}
      /* `center` et non le défaut `top` : Le Cri est un format portrait tronqué
         en bande ici, et cadré en haut la bande ne montrait que les volutes du
         ciel. Descendue au milieu, elle prend le visage et le pont — ce qui rend
         l'œuvre reconnaissable. */
      imagePosition="center"
      height="screen"
    />
  );
}
