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
  /** Sans image, le Hero devient un simple en-tête de page — réutilisable partout. */
  /**
   * Dimensions optionnelles : une image distante de l'API ne les connaît pas.
   * `null` accepté pour pouvoir passer directement le média d'une œuvre, qui
   * peut ne pas en avoir — le bloc s'affiche alors sans visuel.
   */
  image?: Omit<ImageMedia, "type"> | null;
  /**
   * Partie de l'œuvre conservée par la troncature. `top` par défaut, parce que
   * dans une reproduction de tableau le sujet est le plus souvent dans la moitié
   * haute — mais c'est un défaut, pas une règle : une nature morte ou une
   * composition à premier plan chargé demandent `center`, voire `bottom`.
   *
   * Exposé sur le Hero plutôt que décidé à l'intérieur : c'est la PAGE qui
   * choisit l'œuvre, elle seule sait où en est le sujet.
   */
  imagePosition?: "top" | "center" | "bottom";
  /**
   * `screen` cale l'accroche sur exactement une hauteur d'écran. Réservé à
   * l'accueil : sur une page intérieure, un en-tête plein écran ne ferait que
   * repousser le vrai contenu sous la ligne de flottaison.
   */
  height?: "auto" | "screen";
}

/**
 * En-tête de page.
 *
 * Le même composant sert d'accroche pour l'accueil (avec image et bouton) et
 * d'en-tête sobre pour les pages intérieures (sans image). Chaque élément
 * optionnel est piloté par une prop plutôt que par une copie du composant.
 *
 * MISE EN PAGE : le titre prend la largeur d'une colonne de lecture en haut du
 * bloc, puis le texte d'introduction et l'œuvre se partagent la ligne suivante.
 * Auparavant tout était empilé — titre, texte, bouton, puis un bandeau pleine
 * largeur — et le bloc faisait à lui seul une fois et demie la hauteur de
 * l'écran : on ne voyait jamais ni le début ni la fin d'une section, et le
 * défilement ne s'arrêtait nulle part.
 */
export function Hero({
  eyebrow,
  title,
  lead,
  action,
  image,
  imagePosition = "top",
  height = "auto",
}: HeroProps) {
  const isScreen = height === "screen";

  return (
    /* `pb-0` uniquement SANS image ET hors plein écran : le bloc suivant apporte
       alors sa propre marge haute et une seconde ferait double emploi. */
    <Section
      spacing={isScreen ? "compact" : "large"}
      height={height}
      className={image || isScreen ? undefined : "pb-0"}
    >
      {/* `compact` en plein écran, et non le rythme normal du site : la hauteur
          est plafonnée par l'écran, donc chaque rem de marge se retire
          directement de la reproduction. Le rythme large a du sens entre deux
          blocs qui s'enchaînent librement, pas à l'intérieur d'un bloc qui ne
          peut pas grandir.

          `justify-center` ne joue qu'en hauteur libre : en plein écran, la ligne
          du bas est en `flex-1` et occupe déjà tout le reste.

          L'écart titre / suite est plus large quand une œuvre suit : il sépare
          alors deux blocs distincts, là où sur un en-tête de page intérieure il
          ne sépare qu'un titre de son chapeau. */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col justify-center",
          image ? "gap-10" : "gap-6",
        )}
      >
        <div className="max-w-reading space-y-4">
          {eyebrow && (
            <p className="font-medium text-ink-mute text-xs uppercase tracking-[0.2em]">
              {eyebrow}
            </p>
          )}

          <TextReveal>
            <Heading as="h1" size="display">
              {title}
            </Heading>
          </TextReveal>
        </div>

        {/* Sans œuvre, pas de grille : le texte reprend simplement la largeur de
            lecture sous le titre — c'est le cas des en-têtes de pages
            intérieures. Une grille à une seule colonne l'aurait rétréci de
            moitié pour rien. */}
        <div
          className={
            image
              ? "grid min-h-0 flex-1 grid-cols-[1fr_1.15fr] items-stretch gap-16"
              : undefined
          }
        >
          {(lead || action) && (
            /* `self-start` et non `self-center` : le chapeau et le bouton
               prolongent le titre, ils doivent le suivre immédiatement. Centrés
               sur la hauteur de l'œuvre, ils décrochaient de lui et ouvraient un
               blanc au milieu de la colonne. */
            <div className="max-w-reading space-y-6 self-start">
              {lead && <p className="text-ink-soft text-lead">{lead}</p>}

              {action && (
                <div className="pt-2">
                  <Button href={action.href}>{action.label}</Button>
                </div>
              )}
            </div>
          )}

          {/* `cover`, et donc une troncature assumée, contrairement aux cartes
              de la collection qui montrent l'œuvre entière : ici le cadre est
              imposé par la hauteur de l'écran, et une œuvre en `contain` y
              laisserait deux larges bandes vides de part et d'autre.

              `imagePosition` est ce qui rend cette troncature acceptable : sur
              une reproduction de tableau le sujet est le plus souvent dans la
              moitié haute, d'où le défaut `top` — mais la page peut descendre
              le cadrage quand l'œuvre l'exige. L'œuvre entière reste visible
              sur sa fiche, à un clic d'ici.

              `height="full"` et pas de `ratio` en plein écran : la hauteur
              vient de la ligne de grille, elle-même étirée sur la place
              restante, et l'œuvre s'y inscrit. Hors plein écran il n'y a rien
              pour la fixer, d'où le cadre 4/3. */}
          {/* Équerres de cadrage : la signature graphique du site, reprise du
              monogramme. Elles marquent l'œuvre qu'on REGARDE — jamais celles
              qu'on parcourt, voir <Frame />. */}
          {image && (
            <Frame className={isScreen ? "min-h-0" : undefined}>
              <Media
                item={{ type: "image", ...image }}
                ratio={isScreen ? undefined : "landscape"}
                height={isScreen ? "full" : "auto"}
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
