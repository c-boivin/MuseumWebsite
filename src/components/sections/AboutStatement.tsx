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
  /** Chiffres clés. Trois au maximum : la rangée est en trois colonnes. */
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
   * Ajoute une loupe de verre qui suit le curseur sur la reproduction.
   *
   * Une PROP et non un choix codé en dur, parce que l'effet ne se justifie que
   * sur une œuvre dont la matière peinte est le sujet — un détail de Monet, oui ;
   * une estampe à aplats, non. C'est le bloc qui sait quelle œuvre il montre.
   */
  lens?: boolean;
  /**
   * `screen` cale le bloc sur exactement une hauteur d'écran, ce qui en fait
   * aussi un point d'aimantation du scroll (voir `Section`).
   */
  height?: "auto" | "screen";
}

/**
 * Bloc éditorial de l'accueil : la ligne du musée en une phrase, puis ce qui la
 * prouve — un détail d'œuvre et trois chiffres.
 *
 * DEUX CHOIX DE MISE EN PAGE, valables dans les deux hauteurs :
 *
 * 1. LE TEXTE EST DÉCALÉ À DROITE, face à un titre qui part de la marge gauche.
 *    C'est ce décrochage qui distingue le bloc d'une colonne de texte posée à
 *    côté d'une image — la mise en page symétrique qu'il remplace.
 * 2. L'IMAGE EST UNE BANDE, et elle l'assume : elle est légendée « détail ».
 *    Le site pose partout qu'on ne rogne pas une œuvre ; l'exception se tient
 *    tant qu'elle est nommée, comme un détail en pleine page dans un catalogue
 *    d'exposition. L'œuvre entière reste à un clic, sur sa fiche.
 *
 * CE QUE CHANGE `height="screen"`, et pourquoi ce n'est pas qu'un réglage : en
 * hauteur libre, le bloc s'étale et c'est l'image qui impose sa taille (un cadre
 * 21/9). Calé sur l'écran, le rapport s'inverse — tout le reste est mesuré au
 * plus juste et l'image prend ce qui reste (`flex-1`). D'où le titre en taille
 * `title` plutôt que `display` et les chiffres resserrés : chaque rem repris
 * ailleurs va à l'œuvre, qui est le sujet du bloc.
 *
 * Server Component : aucun état, aucune interaction. Tout est rendu sur le
 * serveur et n'ajoute rien au JavaScript envoyé au navigateur.
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

  /* `position="center"` et non le `top` habituel : sur une bande aussi large, le
     haut d'une toile ne donne souvent que du ciel ou du fond. Le centre garde le
     motif. */
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
        {/* EN-TÊTE. En hauteur libre, le titre occupe sa propre ligne en grand
            et le texte vient dessous, décalé à droite : c'est le rythme aéré
            d'une double page. Calé sur l'écran, les deux passent côte à côte —
            empilés, ils prendraient à eux seuls la moitié de la hauteur. */}
        <div
          className={
            isScreen
              ? "grid grid-cols-[1.15fr_1fr] items-end gap-20"
              : /* En hauteur libre les deux colonnes s'empilent, et rien ne les
                   séparait : le texte venait buter sous la deuxième ligne du
                   titre. 4rem, et pas moins — à la taille `display`, un titre
                   sur deux lignes a besoin d'un écart franc pour qu'on voie
                   qu'il est FINI avant que le paragraphe commence. */
                "space-y-16"
          }
        >
          <div className={isScreen ? "space-y-4" : "space-y-6"}>
            {eyebrow && (
              <p className="font-medium text-ink-mute text-xs uppercase tracking-[0.2em]">
                {eyebrow}
              </p>
            )}

            {/* `max-w-[52rem]` en hauteur libre : à la taille `display`, une
                ligne pleine largeur ferait près de 90 signes et deviendrait
                pénible à lire. Deux lignes courtes se lisent comme une phrase
                affichée. */}
            <Heading
              as="h2"
              size={isScreen ? "title" : "display"}
              className={isScreen ? undefined : "max-w-[52rem]"}
            >
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
          /* `flex-1` + `min-h-0` : l'œuvre absorbe toute la hauteur laissée par
             le reste, au lieu de la fixer avec un ratio qui ne tiendrait pas
             compte de l'écran. `min-h-0` est ce qui l'autorise à RÉTRÉCIR — un
             élément flex refuse par défaut de passer sous sa taille naturelle,
             et le bloc déborderait. */
          <figure
            /* POINT D'ARRÊT DU SCROLL, et il est posé sur l'ŒUVRE, pas sur le
               bloc. Les deux blocs précédents font une hauteur d'écran : les
               aimanter par le haut les montre en entier. Celui-ci est plus long
               qu'un écran, l'aimanter par le haut couperait tout ce qui suit le
               titre. En marquant la figure, le scroll se repose avec la bande
               au milieu de l'écran — on s'arrête sur l'œuvre, ce qui est le
               seul endroit du bloc qui mérite qu'on s'arrête.

               Inutile quand le bloc fait lui-même une hauteur d'écran : la
               Section est alors déjà un point d'arrêt, et deux repères si
               proches se disputeraient le scroll. */
            data-snap-center={isScreen ? undefined : ""}
            className={
              isScreen ? "flex min-h-0 flex-1 flex-col gap-4" : undefined
            }
          >
            {/* CE DIV N'EST PAS DÉCORATIF, et le retirer refait disparaître
                l'œuvre. En plein écran, <Media /> passe en mode `fill` : l'image
                est en position absolue et ne porte aucune hauteur propre, elle
                dépend entièrement de son cadre. Or la hauteur remontait ici par
                une chaîne de POURCENTAGES (`h-full` sur `h-full` sur un
                `flex-1`), et `Section` ne déclare qu'un `min-h-viewport` — une
                hauteur MINIMALE, donc indéfinie au sens de CSS. Une chaîne de
                pourcentages appuyée sur une hauteur indéfinie se résout en
                `auto` : tout s'effondrait à zéro et l'œuvre n'était nulle part.

                Ce div coupe la chaîne. Lui prend la place restante en `flex-1`
                — mécanisme flex, pas pourcentage — et sert d'origine à un cadre
                en `absolute inset-0`, dont la hauteur est alors définie sans
                ambiguïté. Les `h-full` en dessous ont enfin quelque chose à
                quoi se rapporter.

                C'est aussi pour cette raison que Hero et Selection n'ont jamais
                eu le problème : leur image est soit une cellule de grille, soit
                un élément déjà `absolute`. */}
            <div className={isScreen ? "relative min-h-0 flex-1" : undefined}>
              <Frame className={isScreen ? "absolute inset-0" : undefined}>
                {/* La loupe rend le contenu DEUX fois — l'original et la copie
                    agrandie — d'où l'élément monté dans une variable plutôt que
                    recopié : une seule description d'image à tenir à jour. */}
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
             paire terme / définition, et c'est ce qui permet à un lecteur
             d'écran d'annoncer « 39, œuvres au catalogue » au lieu de deux
             fragments sans lien.

             `flex-col-reverse` : le <dt> reste avant le <dd> dans le DOM, comme
             la spécification l'exige, mais le chiffre s'affiche au-dessus de son
             intitulé. L'ordre visuel et l'ordre sémantique n'ont pas à
             coïncider. */
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
                <dd
                  className={cn(
                    "font-display",
                    isScreen ? "text-xl" : "text-title",
                  )}
                >
                  {figure.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Section>
  );
}
