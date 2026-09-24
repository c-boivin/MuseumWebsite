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
  /** Œuvres de la colonne. Sans elles, le texte prend toute la place. */
  artworks: readonly ArtworkPreview[];
}

/**
 * Corps de la page À propos : une colonne d'œuvres à gauche, le texte à droite.
 *
 * Deux règles qui se répondent : la grille est en `stretch` par défaut, donc la
 * colonne de gauche prend toute la hauteur de la rangée imposée par le texte —
 * avec un `items-start`, elle se réduirait à la hauteur de son contenu. Et la
 * colonne de texte est bornée par `max-w-reading` : la grille donne la position,
 * pas la longueur de ligne.
 *
 * La spirale n'est pas épinglée. `motion/ScrollPin` fait le travail, mais figer
 * la colonne pendant que la chaîne tourne donnait deux mouvements
 * contradictoires. Une colonne pleine hauteur donne le même accompagnement du
 * regard, sans le heurt au scroll.
 */
export function AboutChapters({ chapters, artworks }: AboutChaptersProps) {
  /* Aucun visuel exploitable — API injoignable, ou œuvres sans reproduction : le
     texte reprend toute la largeur au lieu de laisser une colonne vide de 36rem. */
  const hasSpiral = artworks.some((artwork) => artwork.media);

  return (
    /* `compact` et non `large` : au-dessus se trouve un bloc plein écran dont la
       marge basse fait déjà respirer. Deux grandes marges bout à bout ouvraient
       près de 300px entre l'œuvre d'accroche et le premier chapitre. */
    <Section spacing="compact">
      <div
        className={
          hasSpiral
            ? "grid min-h-[40rem] grid-cols-[36rem_1fr] gap-gutter"
            : undefined
        }
      >
        {/* 36rem : le débattement horizontal de la spirale vaut 426px, il faut de
            la marge autour sinon les cartes sont tranchées par le bord. Restent
            39rem pour le texte, un peu sous `max-w-reading`, ce qui reste
            confortable.

            `min-h-[40rem]` parce que la hauteur de la rangée vient du texte : un
            chapitre de moins et la chaîne n'aurait plus la place de s'effacer
            avant le bord. Le plancher rend la spirale indépendante de la longueur
            du contenu éditorial. */}
        {hasSpiral && <ArtworkSpiral artworks={artworks} />}

        <div className="max-w-reading space-y-16">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              id={chapter.id}
              className="scroll-mt-24 space-y-4"
            >
              <Heading as="h2" size="heading">
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
