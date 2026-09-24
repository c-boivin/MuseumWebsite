import { TextReveal } from "@/components/motion/TextReveal";
import { Button } from "@/components/ui/Button";
import { Frame } from "@/components/ui/Frame";
import { Heading } from "@/components/ui/Heading";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/cn";
import type { ImageMedia } from "@/types/media";

interface HeroProps {
  eyebrow?: string;
  title: string;
  lead?: string;
  action?: { label: string; href: string };
  /**
   * Sans image, le Hero devient un simple en-tête de page. Dimensions
   * optionnelles : une image distante de l'API ne les connaît pas. `null`
   * accepté pour pouvoir passer directement le média d'une œuvre.
   */
  image?: Omit<ImageMedia, "type"> | null;
  /**
   * Partie de l'œuvre conservée par la troncature. `top` par défaut, le sujet
   * d'un tableau étant le plus souvent dans la moitié haute. Exposé sur le Hero
   * plutôt que décidé à l'intérieur : c'est la page qui choisit l'œuvre.
   */
  imagePosition?: "top" | "center" | "bottom";
  /**
   * Proportions du cadre. `landscape` (4/3) pour la majorité du catalogue,
   * `wide` (16/9) pour les toiles nettement plus larges que hautes, `banner`
   * (21/9) pour une accroche plein écran. Laissé vide, suit `FRAME_RATIO`.
   */
  imageRatio?: "landscape" | "wide" | "banner";
  /**
   * `screen` cale l'accroche sur une hauteur d'écran. Réservé à l'accueil : sur
   * une page intérieure, ça ne ferait que repousser le contenu sous la ligne de
   * flottaison.
   */
  height?: "auto" | "screen";
  /**
   * Fente libre sous le chapeau, avant le bouton.
   *
   * « Mon profil » devait y mettre l'ancienneté du compte et le nombre de
   * favoris : ni un chapeau ni un bouton, et sans aucun sens sur les autres
   * pages — en faire une prop typée aurait imposé partout un vocabulaire de
   * compte.
   */
  children?: React.ReactNode;
}

/**
 * En-tête de page.
 *
 * Le même composant sert d'accroche pour l'accueil (avec image et bouton) et
 * d'en-tête sobre pour les pages intérieures.
 *
 * Le titre prend la largeur d'une colonne de lecture, puis le texte et l'œuvre
 * se partagent la ligne suivante. Tout empilé, le bloc faisait une fois et
 * demie la hauteur de l'écran et le défilement ne s'arrêtait nulle part.
 */
export function Hero({
  eyebrow,
  title,
  lead,
  action,
  image,
  imagePosition = "top",
  imageRatio,
  height = "auto",
  children,
}: HeroProps) {
  const isScreen = height === "screen";

  /* Le cadre a toujours un rapport fixe, y compris en plein écran. Voir
     `FRAME_RATIO` sous le composant. */
  const ratio = imageRatio ?? FRAME_RATIO[isScreen ? "screen" : "auto"];

  return (
    <Section
      /* `compact` dans les deux modes : 4,5rem est le rythme de haut de page du
         site. En `large`, une page intérieure commençait deux fois plus bas que
         l'accueil. */
      spacing="compact"
      height={height}
      /* `pb-0` hors plein écran : le bloc suivant apporte sa propre marge haute,
         une seconde ferait près de trois cents pixels de blanc. */
      className={isScreen ? undefined : "pb-0"}
    >
      {/* `compact` en plein écran : la hauteur est plafonnée par l'écran, chaque
          rem de marge se retire de la reproduction.

          L'écart titre / suite est plus large quand une œuvre suit : il sépare
          alors deux blocs, et non un titre de son chapeau. */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col justify-center",
          image ? "gap-10" : "gap-6",
        )}
      >
        <div className="max-w-reading space-y-4">
          {eyebrow && <p className="eyebrow text-ink-mute">{eyebrow}</p>}

          <TextReveal>
            <Heading as="h1" size="display">
              {title}
            </Heading>
          </TextReveal>
        </div>

        {/* Sans œuvre, pas de grille : une grille à une colonne rétrécirait le
            texte de moitié pour rien.

            Pas de `flex-1` sur la ligne : sa hauteur vient du rapport du cadre
            et non de la place restante. Autrement le format de l'œuvre dépendait
            de la hauteur de la fenêtre, donc du poste.

            `items-start` : le chapeau suit le titre au lieu de se centrer sur
            l'œuvre. */}
        <div
          className={
            image ? "grid grid-cols-[1fr_1.15fr] items-start gap-16" : undefined
          }
        >
          {(lead || children || action) && (
            /* `self-start` : centrés sur la hauteur de l'œuvre, le chapeau et le
               bouton décrochaient du titre. */
            <div className="max-w-reading space-y-6 self-start">
              {lead && <p className="text-ink-soft text-lead">{lead}</p>}

              {children}

              {action && (
                <div className="pt-2">
                  <Button href={action.href}>{action.label}</Button>
                </div>
              )}
            </div>
          )}

          {/* `cover` et troncature assumée, contrairement aux cartes de la
              collection : le cadre est imposé, une œuvre en `contain` y
              laisserait deux bandes vides. L'œuvre entière reste sur sa fiche.

              Les équerres de <Frame /> marquent l'œuvre qu'on regarde, jamais
              celles qu'on parcourt. */}
          {image && (
            <Frame>
              <Media
                item={{ type: "image", ...image }}
                ratio={ratio}
                position={imagePosition}
                priority
                sizes="50vw"
              />
            </Frame>
          )}
        </div>
      </div>
    </Section>
  );
}

/**
 * Le rapport du cadre quand la page n'en impose pas.
 *
 * En plein écran, le cadre n'avait aucun rapport : sa hauteur était ce qui
 * restait sous le titre, donc le format de l'œuvre suivait la hauteur de la
 * fenêtre et changeait d'un poste à l'autre. C'était le seul endroit du site où
 * une dimension dépendait de la hauteur ; tout le reste suit la largeur.
 *
 * `banner` (21/9) est le format qu'on obtenait sur un écran de portable.
 * `landscape` (4/3) vaut pour les en-têtes de pages intérieures, qui ne
 * partagent leur hauteur avec rien.
 */
const FRAME_RATIO = {
  screen: "banner",
  auto: "landscape",
} as const;
