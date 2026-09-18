import { ArtworkMeta } from "@/components/artwork/ArtworkMeta";
import { FavoriteButton } from "@/components/artwork/FavoriteButton";
import { TextReveal } from "@/components/motion/TextReveal";
import { TransitionLink as Link } from "@/components/motion/TransitionLink";
import { Frame } from "@/components/ui/Frame";
import { Heading } from "@/components/ui/Heading";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";
import type { Artwork } from "@/types/artwork";

interface ArtworkDetailProps {
  artwork: Artwork;
  /** Où remonte le lien de retour : la collection du musée, ou celle du visiteur. */
  backHref: string;
  backLabel: string;
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
 * Server Component : seuls `TextReveal` et le signet ont besoin du navigateur.
 */
export function ArtworkDetail({
  artwork,
  backHref,
  backLabel,
}: ArtworkDetailProps) {
  return (
    /* Une fiche = UN écran, sans scroll. Le cartel d'un musée tient sur un seul
       panneau à côté du tableau : on ne fait pas défiler un mur. `height="screen"`
       borne le bloc à la hauteur utile (l'écran moins le header collant), et
       c'est l'image qui absorbe la place restante — pas l'inverse. */
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
      <Link
        href={backHref}
        className="shrink-0 text-ink-mute text-sm underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
      >
        ← {backLabel}
      </Link>

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
  );
}
