import { Button } from "@/components/ui/Button";
import { Frame } from "@/components/ui/Frame";
import { GlassLens } from "@/components/ui/GlassLens";
import { Heading } from "@/components/ui/Heading";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/cn";
import type { ImageMedia } from "@/types/media";

interface Figure {
  /** Le chiffre, déjà mis en forme. */
  value: string;
  label: string;
}

interface AboutStatementProps {
  eyebrow?: string;
  title: string;
  paragraphs: string[];
  /** Trois au maximum : la rangée est en trois colonnes. */
  figures?: Figure[];
  action?: { label: string; href: string };
  /**
   * Dimensions optionnelles : une image distante de l'API ne les connaît pas.
   * `null` accepté pour pouvoir passer directement le média d'une œuvre.
   */
  image?: Omit<ImageMedia, "type"> | null;
  /** Cartel de la bande : « Détail — Water Lilies, Claude Monet ». */
  imageCaption?: string;
  /**
   * Une prop et non un choix codé en dur : l'effet ne se justifie que sur une
   * œuvre dont la matière peinte est le sujet. C'est le bloc qui sait quelle
   * œuvre il montre.
   */
  lens?: boolean;
  /**
   * `screen` cale le bloc sur une hauteur d'écran ; en `auto` il est plus long
   * et l'œuvre vient au milieu.
   */
  height?: "auto" | "screen";
}

/**
 * Bloc éditorial de l'accueil : la ligne du musée en une phrase, puis ce qui la
 * prouve — un détail d'œuvre et trois chiffres.
 *
 * Deux choix de mise en page : le texte est décalé à droite face à un titre qui
 * part de la marge gauche, ce qui distingue le bloc d'une colonne posée à côté
 * d'une image ; et l'image est une bande assumée, légendée « détail ». Le site
 * pose partout qu'on ne rogne pas une œuvre — l'exception se tient tant qu'elle
 * est nommée, comme dans un catalogue d'exposition.
 *
 * `height="screen"` inverse le rapport : en hauteur libre c'est l'image qui
 * impose sa taille, calé sur l'écran tout le reste est mesuré au plus juste et
 * l'image prend ce qui reste. D'où le titre en `title` et les chiffres
 * resserrés, chaque rem repris ailleurs va à l'œuvre.
 *
 * Server Component : aucun état, rien n'est ajouté au JavaScript envoyé.
 */
export function AboutStatement({
  eyebrow,
  title,
  paragraphs,
  figures,
  action,
  image,
  imageCaption,
  lens = false,
  height = "auto",
}: AboutStatementProps) {
  const isScreen = height === "screen";

  /* `center` et non le `top` habituel : sur une bande aussi large, le haut d'une
     toile ne donne souvent que du ciel. */
  const mediaElement = image ? (
    <Media
      item={{ type: "image", ...image }}
      ratio={isScreen ? undefined : "banner"}
      height={isScreen ? "full" : "auto"}
      fit="cover"
      position="center"
      sizes="100vw"
    />
  ) : null;

  return (
    <Section
      tone="surface"
      spacing={isScreen ? "compact" : "large"}
      height={height}
    >
      <div
        className={
          isScreen ? "flex min-h-0 flex-1 flex-col gap-8" : "space-y-24"
        }
      >
        {/* En hauteur libre le titre occupe sa ligne et le texte vient dessous ;
            calé sur l'écran, les deux passent côte à côte — empilés, ils
            prendraient la moitié de la hauteur. */}
        <div
          className={
            isScreen
              ? "grid grid-cols-[1.15fr_1fr] items-end gap-20"
              : /* 4rem, et pas moins : à la taille `display`, un titre sur deux
                   lignes a besoin d'un écart franc pour qu'on voie qu'il est
                   fini avant que le paragraphe commence. */
                "space-y-16"
          }
        >
          <div className={isScreen ? "space-y-4" : "space-y-6"}>
            {eyebrow && <p className="eyebrow text-ink-mute">{eyebrow}</p>}

            {/* `title` dans les deux cas : celui de `Selection` juste au-dessus
                s'écrit à `title`, et deux blocs de même rang s'affichaient du
                simple au double. Le `display` reste réservé à l'accroche plein
                écran — un seul par page, sinon il n'accroche plus rien. */}
            <Heading as="h2" size="title">
              {title}
            </Heading>
          </div>

          <div
            className={cn(
              "space-y-5",
              /* Hors plein écran, le texte n'est pas dans une grille : on le
                 décale à la main sur la moitié droite. */
              !isScreen && "ml-auto max-w-reading",
            )}
          >
            {paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="text-ink-soft text-lead"
              >
                {paragraph}
              </p>
            ))}

            {action && (
              <div className="pt-1">
                <Button href={action.href} variant="ghost">
                  {action.label}
                </Button>
              </div>
            )}
          </div>
        </div>

        {image && (
          /* `flex-1` + `min-h-0` : l'œuvre absorbe la hauteur laissée par le
             reste. `min-h-0` est ce qui l'autorise à rétrécir — un élément flex
             refuse par défaut de passer sous sa taille naturelle. */
          <figure
            className={
              isScreen ? "flex min-h-0 flex-1 flex-col gap-4" : undefined
            }
          >
            {/* Ce div n'est pas décoratif : le retirer refait disparaître
                l'œuvre. En plein écran, <Media /> passe en `fill` et ne porte
                aucune hauteur propre ; la hauteur remontait par une chaîne de
                pourcentages alors que `Section` ne déclare qu'un
                `min-h-viewport`, donc une hauteur indéfinie au sens de CSS. La
                chaîne se résolvait en `auto` et tout s'effondrait à zéro.

                Ce div coupe la chaîne : il prend la place restante en `flex-1`
                — mécanisme flex, pas pourcentage — et sert d'origine à un cadre
                `absolute inset-0`, dont la hauteur est enfin définie.

                C'est pour ça que Hero et Selection n'ont jamais eu le problème :
                leur image est une cellule de grille ou déjà `absolute`. */}
            <div className={isScreen ? "relative min-h-0 flex-1" : undefined}>
              <Frame className={isScreen ? "absolute inset-0" : undefined}>
                {/* La loupe rend le contenu deux fois, d'où l'élément monté dans
                    une variable : une seule description d'image à tenir à jour. */}
                {lens ? (
                  <GlassLens className={isScreen ? "h-full" : undefined}>
                    {mediaElement}
                  </GlassLens>
                ) : (
                  mediaElement
                )}
              </Frame>
            </div>

            {imageCaption && (
              <figcaption
                className={cn(
                  "text-ink-mute text-sm",
                  !isScreen && "mt-4",
                  isScreen && "shrink-0",
                )}
              >
                {imageCaption}
              </figcaption>
            )}
          </figure>
        )}

        {figures && figures.length > 0 && (
          /* <dl> et non trois <div> : un chiffre et son intitulé forment une
             paire terme / définition, ce qui permet d'annoncer « 39, œuvres au
             catalogue » au lieu de deux fragments sans lien.

             `flex-col-reverse` : le <dt> reste avant le <dd> dans le DOM comme la
             spécification l'exige, mais le chiffre s'affiche au-dessus. */
          <dl
            className={cn(
              "grid shrink-0 grid-cols-3 border-line border-t",
              isScreen && "gap-0",
            )}
          >
            {figures.map((figure, i) => (
              <div
                key={figure.label}
                className={cn(
                  "flex flex-col-reverse gap-1",
                  isScreen ? "py-4" : "gap-2 py-10",
                  i > 0 &&
                    (isScreen
                      ? "border-line border-l pl-10"
                      : "border-line border-l pl-12"),
                )}
              >
                <dt className="text-ink-mute text-sm">{figure.label}</dt>
                {/* Une seule taille, la même que `MuseumFigures` sur la même
                    page : un chiffre clé n'a qu'un corps sur ce site. Les deux
                    séries s'affichaient à 2.75rem ici et 5rem là-bas pour un
                    balisage identique. */}
                <dd className="font-display text-figure">{figure.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Section>
  );
}
