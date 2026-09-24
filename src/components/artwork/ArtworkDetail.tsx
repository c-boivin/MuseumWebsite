import { ArtworkByArtist } from "@/components/artwork/ArtworkByArtist";
import { ArtworkMeta } from "@/components/artwork/ArtworkMeta";
import { ArtworkNotice } from "@/components/artwork/ArtworkNotice";
import { FavoriteButton } from "@/components/artwork/FavoriteButton";
import { TextReveal } from "@/components/motion/TextReveal";
import { TransitionLink as Link } from "@/components/motion/TransitionLink";
import { Frame } from "@/components/ui/Frame";
import { Heading } from "@/components/ui/Heading";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";
import type { Artwork, ArtworkPreview } from "@/types/artwork";

/**
 * Ancre de la notice, partagée par le lien du premier écran et par le bloc
 * qu'il vise. Écrite une fois : deux chaînes `"notice"` en vis-à-vis, c'est un
 * lien qui cesse de fonctionner à la première faute de frappe, sans rien casser
 * que TypeScript puisse voir.
 */
const NOTICE_ID = "notice";

interface ArtworkDetailProps {
  artwork: Artwork;
  /** Où remonte le lien de retour : la collection du musée, ou celle du visiteur. */
  backHref: string;
  backLabel: string;
  /**
   * Les autres œuvres du même artiste, chargées par la PAGE et non ici.
   *
   * Ce composant ne va chercher aucune donnée — même règle que `ArtworkCard`.
   * C'est la route qui sait d'où viennent les œuvres et ce qu'elle a le droit de
   * charger ; le composant ne fait que les mettre en page. Un tableau vide fait
   * disparaître le bloc, ce qui est le cas le plus fréquent du catalogue : six
   * artistes seulement y ont plus d'une œuvre.
   */
  sameArtist: ArtworkPreview[];
}

/**
 * La fiche d'une œuvre : reproduction encadrée à gauche, cartel à droite.
 *
 * ── POURQUOI CE COMPOSANT EXISTE ──
 * La même fiche s'affiche sous DEUX adresses : `/collection/[slug]`, publique et
 * pré-générée, et `/compte/collection/[slug]`, celle qu'on atteint depuis sa
 * propre collection. Les deux routes ne diffèrent que par ce qu'elles font AVANT
 * d'afficher — l'une se pré-génère au build, l'autre vérifie une session — et par
 * le lien de retour. Tout le reste est ici, écrit une fois : recopier une mise en
 * page de cette taille, c'est garantir que la prochaine retouche n'en rattrapera
 * qu'une sur deux.
 *
 * ── LE LIEN DE RETOUR EST UNE PROP, ET C'EST TOUT L'ENJEU ──
 * Arriver sur une œuvre depuis sa collection puis se faire renvoyer dans le
 * catalogue entier, c'est perdre sa place. Chaque route dit donc d'où l'on vient.
 *
 * ── LA FICHE FAIT TROIS BLOCS, ET LE PREMIER TIENT UN ÉCRAN EXACTEMENT ──
 * Elle n'en faisait qu'un — la reproduction et son cartel, sans défilement. Ce
 * parti pris tenait tant que la fiche n'affichait que le cartel ; le sujet
 * demande une page « qui recoupe TOUTES ses données » et une redirection vers
 * des tableaux similaires, soit deux blocs de plus. Les enfermer dans le même
 * écran aurait réduit la reproduction à une vignette, c'est-à-dire sacrifié le
 * sujet de la page pour préserver une règle de mise en page.
 *
 * L'accrochage est donc conservé là où il compte : le PREMIER écran reste
 * l'œuvre et son cartel, seuls, sans rien qui dépasse sous la ligne de
 * flottaison. Ce qui s'ajoute vit dessous, et se rejoint volontairement — d'où
 * le lien d'ancre en haut à droite, qui annonce la notice au lieu de laisser
 * croire que la page s'arrête là.
 *
 * Server Component : seuls `TextReveal` et le signet ont besoin du navigateur.
 */
export function ArtworkDetail({
  artwork,
  backHref,
  backLabel,
  sameArtist,
}: ArtworkDetailProps) {
  return (
    <>
      {/* LE PREMIER ÉCRAN, sans défilement. Le cartel d'un musée tient sur un
          seul panneau à côté du tableau : on ne fait pas défiler un mur.
          `height="screen"` borne le bloc à la hauteur utile (l'écran moins le
          header collant), et c'est l'image qui absorbe la place restante — pas
          l'inverse. */}
      <Section
        spacing="compact"
        height="screen"
        /* `max-h-viewport` EN PLUS du `min-h-viewport` qu'apporte
           `height="screen"`, et c'est ce qui rend vraie la promesse du
           commentaire ci-dessus.

           `height="screen"` ne pose qu'une hauteur MINIMALE. Sur la fiche au
           cartel le plus haut du catalogue — La Grande Vague, dont le lieu de
           conservation passe sur deux lignes — rien n'empêchait la colonne de
           droite de dépasser : la section grandissait, la ligne de grille avec
           elle, et la reproduction en `h-full` suivait jusqu'à sortir de l'écran.

           Le plafond ferme la mise en page. La hauteur devient définie de bout en
           bout, donc la grille et ses deux colonnes ne peuvent plus grandir, et
           l'`overflow-y-auto` du cartel se déclenche enfin — il ne pouvait pas
           déborder d'une hauteur qui n'existait pas. Contrepartie assumée : sur
           une fenêtre très basse, c'est le cartel qui défile, pas la page. C'est
           exactement ce que le composant annonçait déjà. */
        className="max-h-viewport"
      >
        {/* LE LIEN VERS LA NOTICE EST POSÉ SUR CETTE LIGNE-CI, ET C'EST TOUT
            L'INTÉRÊT. Il fallait dire qu'il y a quelque chose sous l'écran
            sans rien prendre à l'écran lui-même : ce bloc est le seul du site
            borné en hauteur (`max-h-viewport` plus bas), un repère de
            défilement ajouté au bas du cartel aurait poussé la fiche la plus
            chargée du catalogue dans son propre ascenseur. La ligne de retour,
            elle, existe déjà et sa hauteur est celle de son texte : la remplir
            à droite ne coûte rien.

            Le saut jusqu'à la notice est amorti par Lenis et se cale sous le
            header collant grâce au `scroll-padding-top` de `globals.css` — voir
            `motion/TransitionLink`, qui reconnaît une ancre de la page courante
            et retire le saut du routeur pour laisser Lenis faire le trajet
            seul. */}
        <div className="flex shrink-0 items-baseline justify-between gap-8">
          <Link
            href={backHref}
            className="text-ink-mute text-sm underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
          >
            ← {backLabel}
          </Link>

          {artwork.description && (
            <Link
              href={`#${NOTICE_ID}`}
              className="whitespace-nowrap text-ink-mute text-sm underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
            >
              Lire la notice ↓
            </Link>
          )}
        </div>

        {/* `flex-1` réclame toute la hauteur restante sous le lien de retour, et
          `min-h-0` autorise cette ligne à rétrécir sous la taille de son contenu
          — sans lui, une grille refuse de passer sous sa hauteur naturelle et
          déborde de l'écran. */}
        <div className="mt-6 grid min-h-0 flex-1 grid-cols-[1.6fr_1fr] gap-16">
          {/* `height="full"` au lieu d'un `ratio` : la hauteur vient de la mise en
            page, l'image s'y inscrit en `contain` sans jamais être rognée. */}
          {/* Équerres de cadrage : la signature graphique du site, reprise du
            monogramme. Leur place est ici plus que partout ailleurs — c'est LA
            reproduction qu'on est venu voir. Voir <Frame /> pour la règle. */}
          <Frame className="min-h-0">
            <Media
              item={artwork.media}
              height="full"
              fit="contain"
              priority
              sizes="60vw"
              fallbackLabel="Aucune reproduction n'est disponible pour cette œuvre."
              className="bg-surface p-8"
            />
          </Frame>

          {/* Le cartel est centré face à l'œuvre. `overflow-y-auto` est un filet :
            sur un écran très bas, il fait défiler la colonne plutôt que la page. */}
          <div className="flex min-h-0 flex-col justify-center gap-6 overflow-y-auto">
            <div className="space-y-3">
              {artwork.movement && (
                <p className="eyebrow text-ink-mute">{artwork.movement}</p>
              )}
              {/* `key` : d'une fiche à l'autre, React réutiliserait l'instance
                et tenterait de patcher un <h1> dont SplitText a remplacé les
                enfants. La clé force un remontage propre — le découpage est
                défait, puis refait sur le nouveau titre. */}
              <TextReveal key={artwork.slug}>
                <Heading as="h1" size="title">
                  {artwork.title}
                </Heading>
              </TextReveal>
              <p className="text-ink-soft text-lead">
                {artwork.artist ?? "Artiste inconnu"}
                {artwork.year !== null && `, ${artwork.year}`}
              </p>
            </div>

            <ArtworkMeta artwork={artwork} />

            {/* LE SEUL ÉLÉMENT INTERACTIF DE LA FICHE, et il est en bas du cartel
              plutôt que sur la reproduction. Le signet des cartes se pose sur
              l'image parce qu'une grille n'a pas d'autre place disponible ; ici
              la règle du site reprend le dessus — rien ne flotte sur l'œuvre
              qu'on est venu regarder, c'est ce qui vaut aux équerres de cadrage
              d'être réservées à cette page.

              `self-start` : la colonne est un conteneur flex, sans quoi le
              bouton s'étirerait sur toute sa largeur et son texte se
              retrouverait seul à gauche d'une bande vide. */}
            <FavoriteButton
              slug={artwork.slug}
              title={artwork.title}
              variant="labelled"
              className="self-start"
            />
          </div>
        </div>
      </Section>

      {/* `artwork.description` est une chaîne HTML ou `null` : la garde est ici,
          pour que le composant reçoive toujours un contenu. Les 39 œuvres du
          catalogue en ont une, mais l'API prévient que ses champs peuvent
          manquer — et une section « À propos de cette œuvre » vide serait le
          genre de trou qu'on ne découvre qu'en soutenance. */}
      {artwork.description && (
        <ArtworkNotice description={artwork.description} id={NOTICE_ID} />
      )}

      {/* `artwork.artist` peut être `null` — une œuvre anonyme n'a pas d'« autres
          œuvres du même artiste ». Le nom est passé au composant pour qu'il
          puisse le citer, d'où la garde ici plutôt qu'un `?? ""` à l'intérieur,
          qui produirait la phrase « Les autres œuvres de  exposées au musée ». */}
      {artwork.artist !== null && (
        <ArtworkByArtist artworks={sameArtist} artist={artwork.artist} />
      )}
    </>
  );
}
