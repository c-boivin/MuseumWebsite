import { ArtworkSpiral } from "@/components/artwork/ArtworkSpiral";
import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import type { ArtworkPreview } from "@/types/artwork";

interface AboutChaptersProps {
  chapters: readonly {
    /** Sert d'ancre : /a-propos#accessibilite. */
    id: string;
    title: string;
    paragraphs: readonly string[];
  }[];
  /** Œuvres affichées dans la colonne figée. Sans elles, le texte prend toute la place. */
  artworks: readonly ArtworkPreview[];
}

/**
 * Corps de la page À propos : une colonne figée à gauche, le texte qui défile
 * à droite.
 *
 * La mise en page tient en deux règles qui se répondent :
 *
 * - la grille est en **`stretch` par défaut**, donc la colonne de gauche prend
 *   toute la hauteur de la rangée, imposée par le texte. C'est ce qui permet à la
 *   spirale de longer le texte sur toute sa longueur au lieu de s'arrêter au
 *   premier chapitre — avec un `items-start`, la colonne se réduirait à la
 *   hauteur de son contenu ;
 * - la colonne de texte est bornée par `max-w-reading`, la même mesure de confort
 *   de lecture que partout ailleurs sur le site. La grille donne la position, pas
 *   la longueur de ligne.
 *
 * La spirale n'est **pas épinglée**. `motion/ScrollPin` existe et fait le travail,
 * mais figer la colonne pendant que la chaîne de cartes tourne donnait deux
 * mouvements contradictoires à l'écran. Une colonne pleine hauteur donne le même
 * accompagnement du regard, sans le heurt au scroll.
 */
export function AboutChapters({ chapters, artworks }: AboutChaptersProps) {
  /* Aucun visuel exploitable — API injoignable, ou œuvres sans reproduction : le
     texte reprend toute la largeur au lieu de laisser une colonne vide de 36rem
     à sa gauche. La page reste complète et lisible, simplement sans décor. */
  const hasSpiral = artworks.some((artwork) => artwork.media);

  return (
    /* `compact` et non `large` : au-dessus se trouve un bloc PLEIN ÉCRAN, dont
       la marge basse fait déjà respirer. Deux grandes marges bout à bout
       ouvraient un trou de 14,5rem — près de 300px — entre l'œuvre d'accroche et
       le premier chapitre. Le total retombe à 9rem, le même écart qu'entre deux
       blocs de l'accueil. */
    <Section spacing="compact">
      <div
        className={
          hasSpiral
            ? "grid min-h-[40rem] grid-cols-[36rem_1fr] gap-gutter"
            : undefined
        }
      >
        {/* 36rem pour la spirale : le débattement horizontal vaut 2 x 165 + 96 =
            426px, il faut de la marge autour sinon les cartes ressortent sur les
            côtés de la colonne et sont tranchées. Restent 39rem pour le texte —
            en deçà de `max-w-reading` (44rem), donc une colonne de lecture un peu
            plus étroite qu'ailleurs sur le site, ce qui reste confortable.

            `min-h-[40rem]` parce que la hauteur de la rangée vient du texte : un
            chapitre de moins et la chaîne de cartes n'aurait plus la place de
            s'effacer avant le bord, elle serait coupée net. Le plancher rend la
            spirale indépendante de la longueur du contenu éditorial. */}
        {hasSpiral && <ArtworkSpiral artworks={artworks} />}

        <div className="max-w-reading space-y-16">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              id={chapter.id}
              className="scroll-mt-24 space-y-4"
            >
              <Heading as="h2" size="subtitle">
                {chapter.title}
              </Heading>

              {chapter.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="text-ink-soft leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
