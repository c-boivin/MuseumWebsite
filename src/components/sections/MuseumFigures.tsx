import { type CountFormat, CountUp } from "@/components/motion/CountUp";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { ticketCategories } from "@/data/tarifs";
import { formatPrice } from "@/lib/cart";
import { cn } from "@/lib/cn";
import { museumStats } from "@/lib/stats";

interface Figure {
  /** La valeur finale, en nombre : c'est elle qu'on compte à l'écran. */
  value: number;
  format?: CountFormat;
  /** Unité accolée au chiffre, et jamais animée : compter « 0 € → 24 € » oui,
      voir l'euro clignoter avec, non. */
  suffix?: string;
  label: string;
}

/**
 * Le musée en chiffres, et le seul chemin de l'accueil vers la billetterie.
 *
 * Il remplace l'ancien « Venir au musée » : l'information pratique qu'il portait
 * est déjà dans le Footer, on la disait donc deux fois sur le même écran, et un
 * pavé d'horaires au deuxième écran se lit une fois et jamais plus.
 *
 * On a gardé le prix : c'est la seule donnée pratique absente du reste de la
 * page, et la question qu'on se pose avant de cliquer sur un bouton de
 * billetterie.
 *
 * Le prix affiché est le plein tarif et non le plus bas. Une première version
 * annonçait « à partir de 12 € » : exact, mais c'est l'entrée des 5-11 ans — un
 * adulte lisait le prix d'un enfant et découvrait le double à l'arrivée. Les
 * réductions sont annoncées dans l'intitulé, où elles informent sans servir
 * d'appât.
 *
 * Les trois chiffres sont dérivés, aucun n'est écrit ici : un « 24 € » recopié
 * deviendrait faux au premier changement de tarif.
 */
export function MuseumFigures() {
  const museum = museumStats();

  /* Repéré par l'identifiant de sa catégorie et non par sa position : un tarif
     inséré en tête ferait afficher le mauvais prix sans que rien ne casse.
     Repli sur le prix le plus élevé, c'est ce que « plein tarif » veut dire. */
  const fullPrice =
    ticketCategories.find((category) => category.id === "adulte")?.price ??
    Math.max(...ticketCategories.map((category) => category.price));

  /* Le plus bas tarif PAYANT : la gratuité des moins de 5 ans donnerait un
     « réduit dès 0 € » exact mais trompeur. Elle est annoncée à part. */
  const lowestPaidPrice = Math.min(
    ...ticketCategories
      .filter((category) => category.price > 0)
      .map((category) => category.price),
  );

  const figures: Figure[] = [
    { value: museum.yearsOpen, label: "ans d'ouverture au public" },
    {
      value: museum.visitorsSinceOpening,
      /* Notation abrégée : le cumul est une estimation, un « 8 640 000 » exact
         lui prêterait une précision qu'il n'a pas. */
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
        {/* Le bouton est sur la ligne du sur-titre : posé sous les chiffres, il
            fermait la section comme une conclusion alors qu'il est le seul accès
            à la billetterie depuis l'accueil. */}
        <div className="flex items-center justify-between gap-16">
          <p className="eyebrow text-ink-mute">Préparer sa visite</p>

          <Button href="/billetterie">Venir au musée</Button>
        </div>

        {/* <dl> et non des <div> : un chiffre et son intitulé forment une paire
            terme / définition, ce qui permet d'annoncer « 48, ans d'ouverture »
            au lieu de deux fragments sans lien.

            `flex-col-reverse` : le <dt> reste avant le <dd> dans le DOM comme la
            spécification l'exige, mais le chiffre s'affiche au-dessus. */}
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
              {/* `text-figure` et non `text-display` : à 5rem ces chiffres
                  pesaient autant que le titre du Hero, et le bloc éditorial plus
                  bas affichait les siens à 2.75rem. Un seul palier pour les deux
                  séries. */}
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
