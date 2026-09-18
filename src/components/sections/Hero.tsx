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
   * Proportions du cadre de l'œuvre.
   *
   * `landscape` (4/3) convient aux formats portrait et presque carrés, qui sont
   * la majorité du catalogue. `wide` (16/9) est là pour les toiles nettement
   * plus larges que hautes : dans un cadre 4/3, une œuvre en 1,6:1 est rognée de
   * près d'un sixième de sa largeur — on perd les figures des bords, et le cadre
   * paraît trop haut pour ce qu'il contient. `banner` (21/9) est la bande d'une
   * accroche plein écran.
   *
   * C'EST LA PAGE QUI CHOISIT, comme pour `imagePosition` : elle seule sait
   * quelle œuvre elle affiche. Laissée vide, la valeur suit la hauteur du bloc —
   * voir `FRAME_RATIO` sous le composant.
   */
  imageRatio?: "landscape" | "wide" | "banner";
  /**
   * `screen` cale l'accroche sur exactement une hauteur d'écran. Réservé à
   * l'accueil : sur une page intérieure, un en-tête plein écran ne ferait que
   * repousser le vrai contenu sous la ligne de flottaison.
   */
  height?: "auto" | "screen";
  /**
   * Complément posé sous le chapeau, dans la colonne de texte.
   *
   * ── POURQUOI UNE FENTE LIBRE PLUTÔT QU'UNE PROP DE PLUS ──
   * Les accroches du site tiennent toutes en sur-titre, titre, chapeau, bouton.
   * « Mon profil » demandait autre chose : sa colonne de gauche ne portait que
   * deux lignes face à une reproduction bien plus haute, et le vide qui suivait
   * se voyait. Ce qu'il fallait y mettre — depuis quand on est membre, combien
   * d'œuvres on a mises de côté — n'est ni un chapeau ni un bouton, et n'a de
   * sens que sur cette page : en faire une prop typée du Hero aurait imposé à
   * toutes les autres un vocabulaire de compte.
   *
   * Reste donc une fente, que la page remplit comme elle l'entend. Elle vient
   * APRÈS le chapeau et AVANT le bouton, l'ordre d'une lecture : ce qu'on
   * annonce, ce qu'on précise, ce qu'on propose de faire.
   */
  children?: React.ReactNode;
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
  imageRatio,
  height = "auto",
  children,
}: HeroProps) {
  const isScreen = height === "screen";

  /* Le cadre a TOUJOURS un rapport fixe, y compris en plein écran — voir
     `FRAME_RATIO` sous le composant pour ce que ça corrige. */
  const ratio = imageRatio ?? FRAME_RATIO[isScreen ? "screen" : "auto"];

  return (
    <Section
      /**
       * `compact` DANS LES DEUX MODES, et c'est ce qui rend une accroche de page
       * intérieure identique à celle de l'accueil.
       *
       * Le mode « hauteur libre » réclamait `large`, soit 10rem au-dessus du
       * sur-titre contre 4,5rem en plein écran : sous le header, « Mon profil »
       * commençait donc deux fois plus bas que l'accueil, et l'écart se voyait
       * d'autant plus qu'il n'y avait rien dedans.
       *
       * 4,5rem est le rythme de haut de page du site — c'est déjà celui de
       * `/collection`, qui compose son en-tête à la main. Un bloc d'accroche
       * n'avait aucune raison d'y échapper : en plein écran la marge n'est qu'un
       * minimum que le centrage absorbe, en hauteur libre elle décidait seule de
       * l'endroit où la page commence.
       */
      spacing="compact"
      height={height}
      /**
       * `pb-0` DÈS QUE LE BLOC N'EST PAS EN PLEIN ÉCRAN, avec ou sans image.
       *
       * La règle ne valait auparavant que pour les accroches SANS image, sur ce
       * raisonnement : le bloc suivant apporte sa propre marge haute, une seconde
       * ferait double emploi. Le raisonnement est le même avec une image — il
       * n'avait simplement jamais été éprouvé, aucune page intérieure n'en ayant
       * eu jusqu'à « Mon profil ». Le résultat s'y voyait : 10rem sous l'œuvre
       * plus 7,5rem au-dessus des formulaires, soit près de trois cents pixels de
       * blanc entre les deux.
       *
       * En plein écran, rien ne change : la hauteur est celle de l'écran, les
       * marges y sont ce qui empêche le contenu de toucher les bords.
       */
      className={isScreen ? undefined : "pb-0"}
    >
      {/* `compact` en plein écran, et non le rythme normal du site : la hauteur
          est plafonnée par l'écran, donc chaque rem de marge se retire
          directement de la reproduction. Le rythme large a du sens entre deux
          blocs qui s'enchaînent librement, pas à l'intérieur d'un bloc qui ne
          peut pas grandir.

          `justify-center` joue en hauteur libre, et en plein écran uniquement
          quand la ligne du bas bute sur son plafond (voir `max-h-artwork` plus
          bas) : le reste du temps son `flex-1` occupe déjà toute la place.

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
          {eyebrow && <p className="eyebrow text-ink-mute">{eyebrow}</p>}

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
        {/* LA LIGNE NE S'ÉTIRE PLUS, et c'est tout le correctif : sa hauteur
            vient désormais du rapport du cadre, pas de la place qui reste.
            Elle absorbait auparavant toute la hauteur libre (`flex-1`), donc le
            format de l'œuvre dépendait de la HAUTEUR DE LA FENÊTRE — bande large
            sur un portable, presque carré sur un grand écran, et un recadrage
            différent à chaque poste. Un plafond en rem limitait la casse sans la
            supprimer : il ne mordait que sur les écrans hauts.

            Sans `flex-1`, c'est le `justify-center` du parent qui centre le bloc
            dans la hauteur d'écran, au lieu de laisser un blanc sous l'œuvre.

            `items-start` : les deux colonnes n'ont plus la même hauteur, et le
            chapeau doit suivre le titre plutôt que de se centrer sur l'œuvre. */}
        <div
          className={
            image ? "grid grid-cols-[1fr_1.15fr] items-start gap-16" : undefined
          }
        >
          {(lead || children || action) && (
            /* `self-start` et non `self-center` : le chapeau et le bouton
               prolongent le titre, ils doivent le suivre immédiatement. Centrés
               sur la hauteur de l'œuvre, ils décrochaient de lui et ouvraient un
               blanc au milieu de la colonne. */
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
 * ── LE DÉFAUT QUE ÇA CORRIGE ──
 * En plein écran, le cadre n'avait AUCUN rapport : sa hauteur était simplement
 * ce qui restait sous le titre. Le format de l'œuvre dépendait donc de la
 * hauteur de la fenêtre — une bande large sur un portable, une image presque
 * carrée sur un grand écran, et un recadrage différent d'un poste à l'autre. Le
 * bloc le plus visible du site ne se présentait jamais deux fois pareil.
 *
 * C'est le seul endroit du site où une dimension dépendait de la hauteur de
 * l'écran. Tout le reste suit la LARGEUR, par le `rem` fluide : un rapport fixe
 * remet l'accroche dans ce régime, où elle grandit avec l'écran sans jamais
 * changer de proportions.
 *
 * ── LES DEUX VALEURS ──
 * `banner` (21/9) est le format qu'on obtenait sur un écran de portable, celui
 * qui a servi de référence : une bande, parce qu'une accroche plein écran doit
 * laisser la place au titre et au bouton au-dessus d'elle.
 *
 * `landscape` (4/3) vaut pour les en-têtes de pages intérieures, qui ne
 * partagent leur hauteur avec rien et peuvent montrer davantage de la toile.
 *
 * Une page reste libre de passer `imageRatio` : c'est ce que fait « Mon profil »
 * pour la Naissance de Vénus, trop large pour un 4/3.
 */
const FRAME_RATIO = {
  screen: "banner",
  auto: "landscape",
} as const;
