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
 * Ancre de la notice, partagée par le lien et par le bloc qu'il vise. Deux
 * chaînes `"notice"` en vis-à-vis, c'est un lien qui casse à la première faute
 * de frappe sans que TypeScript puisse le voir.
 */
const NOTICE_ID = "notice";

interface ArtworkDetailProps {
  artwork: Artwork;
  /** Où remonte le lien de retour : la collection du musée, ou celle du visiteur. */
  backHref: string;
  backLabel: string;
  /**
   * Chargées par la page et non ici, même règle que `ArtworkCard`. Un tableau
   * vide fait disparaître le bloc, ce qui est le cas le plus fréquent : six
   * artistes seulement ont plus d'une œuvre au catalogue.
   */
  sameArtist: ArtworkPreview[];
}

/**
 * La fiche d'une œuvre : reproduction encadrée à gauche, cartel à droite.
 *
 * La même fiche s'affiche sous deux adresses — `/collection/[slug]`, publique et
 * pré-générée, et `/compte/collection/[slug]`. Elles ne diffèrent que par ce
 * qu'elles font avant d'afficher et par le lien de retour, qui est donc une
 * prop : arriver sur une œuvre depuis sa collection puis se faire renvoyer dans
 * le catalogue entier, c'est perdre sa place.
 *
 * Trois blocs, et le premier tient un écran exactement. La fiche n'en faisait
 * qu'un, mais la notice et les œuvres du même artiste auraient réduit la
 * reproduction à une vignette. Ce qui s'ajoute vit donc dessous, et le lien
 * d'ancre en haut à droite annonce la notice au lieu de laisser croire que la
 * page s'arrête là.
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
      {/* Le premier écran, sans défilement : le cartel d'un musée tient sur un
          panneau à côté du tableau, on ne fait pas défiler un mur. */}
      <Section
        spacing="compact"
        height="screen"
        /* `max-h-viewport` en plus du `min-h-viewport` d'`height="screen"`, qui
           ne pose qu'une hauteur minimale. Sur la fiche au cartel le plus haut
           du catalogue, la colonne de droite débordait, la section grandissait,
           et la reproduction en `h-full` sortait de l'écran.

           Le plafond ferme la mise en page : la hauteur devient définie de bout
           en bout et l'`overflow-y-auto` du cartel se déclenche enfin — il ne
           pouvait pas déborder d'une hauteur qui n'existait pas. */
        className="max-h-viewport"
      >
        {/* Le lien vers la notice est posé sur cette ligne parce qu'elle existe
            déjà et que sa hauteur est celle de son texte : un repère ajouté au
            bas du cartel aurait poussé la fiche la plus chargée dans son propre
            ascenseur, ce bloc étant le seul du site borné en hauteur.

            Le saut est amorti par Lenis et se cale sous le header grâce au
            `scroll-padding-top` de globals.css — voir `motion/TransitionLink`. */}
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

        {/* `min-h-0` autorise la ligne à rétrécir sous la taille de son contenu :
            sans lui, une grille refuse de passer sous sa hauteur naturelle. */}
        <div className="mt-6 grid min-h-0 flex-1 grid-cols-[1.6fr_1fr] gap-16">
          {/* `height="full"` au lieu d'un `ratio` : la hauteur vient de la mise
              en page, l'image s'y inscrit en `contain` sans être rognée.

              Les équerres de <Frame /> ont leur place ici plus que partout
              ailleurs : c'est LA reproduction qu'on est venu voir. */}
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

          {/* `overflow-y-auto` est un filet : sur un écran très bas, c'est la
              colonne qui défile plutôt que la page. */}
          <div className="flex min-h-0 flex-col justify-center gap-6 overflow-y-auto">
            <div className="space-y-3">
              {artwork.movement && (
                <p className="eyebrow text-ink-mute">{artwork.movement}</p>
              )}
              {/* `key` : d'une fiche à l'autre, React réutiliserait l'instance et
                  patcherait un <h1> dont SplitText a remplacé les enfants. */}
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

            {/* En bas du cartel plutôt que sur la reproduction : le signet des
                cartes se pose sur l'image parce qu'une grille n'a pas d'autre
                place, ici la règle du site reprend le dessus — rien ne flotte
                sur l'œuvre qu'on est venu regarder.

                `self-start` : la colonne est un conteneur flex, sans quoi le
                bouton s'étirerait sur toute sa largeur. */}
            <FavoriteButton
              slug={artwork.slug}
              title={artwork.title}
              variant="labelled"
              className="self-start"
            />
          </div>
        </div>
      </Section>

      {/* La garde est ici pour que le composant reçoive toujours un contenu. Les
          39 œuvres en ont une, mais l'API prévient que ses champs peuvent
          manquer. */}
      {artwork.description && (
        <ArtworkNotice description={artwork.description} id={NOTICE_ID} />
      )}

      {/* Le nom est passé au composant pour qu'il puisse le citer, d'où la garde
          ici plutôt qu'un `?? ""` qui donnerait « Les autres œuvres de  ». */}
      {artwork.artist !== null && (
        <ArtworkByArtist artworks={sameArtist} artist={artwork.artist} />
      )}
    </>
  );
}
