import { type CountFormat, CountUp } from "@/components/motion/CountUp";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { ticketCategories } from "@/data/tarifs";
import { formatPrice } from "@/lib/cart";
import { cn } from "@/lib/cn";
import { museumStats } from "@/lib/stats";

interface Figure {
  /** La valeur finale, en NOMBRE : c'est elle qu'on compte à l'écran. */
  value: number;
  format?: CountFormat;
  /** Unité accolée au chiffre, et JAMAIS animée — compter « 0 € → 24 € » oui,
      voir l'euro clignoter avec, non. */
  suffix?: string;
  label: string;
}

/**
 * Le musée en chiffres, et le seul chemin de l'accueil vers la billetterie.
 *
 * CE BLOC REMPLACE l'ancien « Venir au musée », qui alignait horaires, adresse
 * et tarif au milieu de la page. Deux raisons de l'avoir retourné :
 * l'information pratique qu'il portait est DÉJÀ dans le Footer — adresse et
 * horaires y figurent en toutes lettres, donc on la disait deux fois sur le même
 * écran ; et un pavé d'horaires au deuxième écran d'une page d'accueil, c'est un
 * bloc qu'on lit une fois et jamais plus.
 *
 * CE QU'ON A GARDÉ, c'est le prix : c'est la seule donnée pratique qui n'est
 * nulle part ailleurs sur la page, et c'est la question qu'on se pose avant de
 * cliquer sur un bouton de billetterie. Il est donc devenu le troisième chiffre
 * plutôt que de disparaître avec le reste du bloc.
 *
 * LE PRIX AFFICHÉ EST LE PLEIN TARIF, pas le plus bas de la grille. Une
 * première version annonçait « à partir de 12 € » : exact, mais 12 € est
 * l'entrée des 5-11 ans. Un visiteur adulte lisait donc le prix d'un enfant
 * pour décider d'aller à la billetterie, et découvrait le double à l'arrivée —
 * le chiffre le plus bas n'est pas le chiffre le plus utile. Le plein tarif est
 * celui que paie la majorité ; les réductions sont annoncées dans l'intitulé,
 * où elles informent sans servir d'appât.
 *
 * LES TROIS CHIFFRES SONT DÉRIVÉS, aucun n'est écrit ici : les deux premiers de
 * `data/site.ts` via `museumStats()`, le troisième de la grille tarifaire. Un
 * « 24 € » recopié dans ce composant deviendrait faux au premier changement de
 * tarif, et personne n'irait le corriger sur l'accueil.
 */
export function MuseumFigures() {
  const museum = museumStats();

  /* Le plein tarif, repéré par l'identifiant de sa catégorie et non par sa
     position dans la grille : un tarif inséré en tête ferait afficher le
     mauvais prix sans que rien ne casse. Repli sur le prix le plus élevé si la
     catégorie disparaissait un jour — c'est ce que « plein tarif » veut dire. */
  const fullPrice =
    ticketCategories.find((category) => category.id === "adulte")?.price ??
    Math.max(...ticketCategories.map((category) => category.price));

  /* Le plus bas tarif PAYANT, pour l'intitulé : l'entrée gratuite des moins de
     5 ans donnerait un « réduit dès 0 € » exact mais trompeur. La gratuité est
     annoncée à part, en toutes lettres. */
  const lowestPaidPrice = Math.min(
    ...ticketCategories
      .filter((category) => category.price > 0)
      .map((category) => category.price),
  );

  const figures: Figure[] = [
    { value: museum.yearsOpen, label: "ans d'ouverture au public" },
    {
      value: museum.visitorsSinceOpening,
      /* Notation abrégée : le cumul est une estimation (voir `lib/stats.ts`), un
         « 8 640 000 » exact lui prêterait une précision qu'il n'a pas. */
      format: "compact",
      label: "visiteurs depuis l'ouverture",
    },
    {
      value: fullPrice,
      suffix: " €",
      label: `l'entrée plein tarif, réduit dès ${formatPrice(lowestPaidPrice)}, gratuit avant 5 ans`,
    },
  ];

  return (
    <Section spacing="compact">
      <div className="space-y-10">
        {/* Le bouton est sur la ligne du sur-titre, et pas sous les chiffres :
            posé en dessous, il fermait la section comme une conclusion alors
            qu'il est le seul accès à la billetterie depuis l'accueil. En tête de
            bloc, il est lisible avant même qu'on ait lu les chiffres. */}
        <div className="flex items-center justify-between gap-16">
          <p className="eyebrow text-ink-mute">Préparer sa visite</p>

          <Button href="/billetterie">Venir au musée</Button>
        </div>

        {/* <dl> et non des <div> : un chiffre et son intitulé forment une paire
            terme / définition, et c'est ce qui permet à un lecteur d'écran
            d'annoncer « 48, ans d'ouverture au public » au lieu de deux
            fragments sans lien.

            `flex-col-reverse` : le <dt> reste avant le <dd> dans le DOM, comme
            la spécification l'exige, mais le chiffre s'affiche au-dessus de son
            intitulé. L'ordre visuel et l'ordre sémantique n'ont pas à
            coïncider. */}
        <dl className="grid grid-cols-3 border-line border-t">
          {figures.map((figure, i) => (
            <div
              key={figure.label}
              className={cn(
                "flex flex-col-reverse gap-3 py-10",
                i > 0 && "border-line border-l pl-12",
              )}
            >
              <dt className="text-ink-mute text-sm">{figure.label}</dt>
              {/* `text-figure` et non `text-display` : à 5rem, ces trois
                  chiffres pesaient exactement autant que le titre du Hero un
                  écran plus haut, et le bloc éditorial du bas affichait SES
                  chiffres — même balisage, même nature — à 2.75rem. Un seul
                  palier pour les deux séries, voir `globals.css`. */}
              <dd className="font-display text-figure">
                <CountUp to={figure.value} format={figure.format} />
                {figure.suffix}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
