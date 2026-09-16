import { artworkTypeLabel } from "@/data/artwork-types";
import type { Artwork } from "@/types/artwork";

interface ArtworkMetaProps {
  artwork: Artwork;
}

/** Une ligne du cartel. `value` à null = la ligne n'est pas rendue du tout. */
interface MetaRow {
  label: string;
  value: string | null;
  /** Transforme la valeur en lien externe. */
  href?: string | null;
}

/**
 * Le cartel de l'œuvre : le petit panneau d'informations accroché à côté d'un
 * tableau dans un vrai musée.
 *
 * Rendu en <dl> et non en tableau ou en suite de <p> : une liste de définitions
 * est exactement ça, des couples terme / valeur. Un lecteur d'écran annonce
 * alors « Artiste : Vincent van Gogh » au lieu de lire deux textes sans lien.
 *
 * Les lignes vides sont filtrées plutôt qu'affichées avec un tiret : l'API prévient
 * que des champs peuvent manquer, et un cartel à moitié vide fait plus amateur
 * qu'un cartel court.
 */
export function ArtworkMeta({ artwork }: ArtworkMetaProps) {
  const rows: MetaRow[] = [
    { label: "Artiste", value: artwork.artist },
    {
      label: "Année",
      value: artwork.year !== null ? String(artwork.year) : null,
    },
    {
      label: "Nature",
      value: artwork.type ? artworkTypeLabel(artwork.type) : null,
    },
    { label: "Mouvement", value: artwork.movement },
    { label: "Couleur dominante", value: artwork.color },
    {
      label: "Conservée à",
      value: artwork.location,
      href: artwork.locationLink,
    },
  ].filter((row) => row.value !== null);

  return (
    <dl className="divide-y divide-line border-line border-t">
      {rows.map((row) => (
        /* `py-2.5` et non `py-4` : ce cartel est le seul contenu d'une page qui
           doit tenir dans un écran SANS défilement, et six lignes à 2rem de
           respiration chacune y coûtaient 12rem — de quoi faire déborder la
           fiche sur une fenêtre un peu basse. Une ligne de cartel est courte :
           elle n'a pas besoin d'autant d'air pour rester lisible, et un cartel
           dense ressemble d'ailleurs davantage à un vrai panneau de musée. */
        <div
          key={row.label}
          className="grid grid-cols-[10rem_1fr] gap-4 py-2.5"
        >
          <dt className="text-ink-mute text-sm">{row.label}</dt>
          <dd className="text-ink text-sm">
            {row.href ? (
              <a
                href={row.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
              >
                {row.value}
              </a>
            ) : (
              row.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
