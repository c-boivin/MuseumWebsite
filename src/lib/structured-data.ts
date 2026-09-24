import { site } from "@/data/site";
import { toPlainText } from "@/lib/sanitize";
import { absoluteUrl } from "@/lib/site-url";
import type { Artwork } from "@/types/artwork";

/**
 * Données structurées schema.org.
 *
 * En plus des métadonnées : `<title>` et `<meta description>` disent comment
 * ANNONCER la page, schema.org dit ce qu'elle CONTIENT. C'est la différence
 * entre un résultat en deux lignes et une fiche qui affiche l'adresse du musée
 * et ses horaires du jour.
 *
 * Construit ici et non dans les pages, comme `lib/stats.ts` : fonctions pures,
 * et les pages restent des assemblages.
 *
 * `undefined` pour les champs absents — `JSON.stringify` les retire. Un
 * `"creator": null` affirmerait que l'œuvre n'a pas d'auteur, là où l'absence du
 * champ dit seulement qu'on ne sait pas.
 */
export type JsonLdObject = Record<string, unknown>;

/** Adresse postale, partagée par tous les blocs qui décrivent le lieu. */
const postalAddress = {
  "@type": "PostalAddress",
  streetAddress: site.address.street,
  postalCode: site.address.zip,
  addressLocality: site.address.city,
  addressCountry: "FR",
};

/**
 * Le musée en tant qu'institution, à poser une seule fois sur l'accueil :
 * répété partout, ce bloc ne dirait rien de plus — c'est une description du
 * lieu, pas de la page.
 */
export function museumJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Museum",
    name: site.name,
    description: site.description,
    url: absoluteUrl("/"),
    /* L'image générée par `app/opengraph-image.tsx` : une seule image pour les
       réseaux sociaux et pour le balisage. */
    image: absoluteUrl("/opengraph-image"),
    address: postalAddress,
    foundingDate: String(site.openedIn),
    /* Les plages fermées sont écartées : schema.org ne déclare que l'ouverture,
       un jour absent est un jour fermé. */
    openingHoursSpecification: site.openingHours
      .map((slot) => slot.schedule)
      .filter((schedule) => schedule !== null)
      .map((schedule) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [...schedule.dayOfWeek],
        opens: schedule.opens,
        closes: schedule.closes,
      })),
    /* Rattache explicitement la collection, ce qui relie les 39 fiches à
       l'institution. */
    hasPart: {
      "@type": "Collection",
      name: `Collection du ${site.name}`,
      url: absoluteUrl("/collection"),
    },
  };
}

/**
 * Une œuvre, à poser sur `/collection/[slug]`. `VisualArtwork` plutôt que
 * `CreativeWork` : c'est le type qui porte `artform` et `artMedium`, donc celui
 * qui permet de dire « peinture » plutôt que « contenu ».
 */
export function artworkJsonLd(artwork: Artwork): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: artwork.title,
    url: absoluteUrl(`/collection/${artwork.slug}`),
    /* La description de l'API est du HTML : les balises n'ont rien à faire dans
       du balisage destiné à une machine. */
    description: artwork.description
      ? toPlainText(artwork.description)
      : undefined,
    image: artwork.media?.src,
    creator: artwork.artist
      ? { "@type": "Person", name: artwork.artist }
      : undefined,
    /* Une année seule est une date ISO valide, et c'est tout ce que l'API donne. */
    dateCreated: artwork.year ? String(artwork.year) : undefined,
    /* `artform` = la nature de l'objet, telle que l'API la donne. `genre`
       accueille le mouvement : schema.org n'a pas de propriété « mouvement
       artistique ». */
    artform: artwork.type ?? undefined,
    genre: artwork.movement ?? undefined,
    isPartOf: {
      "@type": "Collection",
      name: `Collection du ${site.name}`,
      url: absoluteUrl("/collection"),
    },
  };
}

/** Un maillon du fil d'Ariane : son libellé et son chemin interne. */
export interface BreadcrumbStep {
  name: string;
  path: string;
}

/**
 * Fil d'Ariane : remplace l'URL brute par un chemin lisible sous le résultat de
 * recherche.
 *
 * Le site n'en affiche pas à l'écran, et c'est assumé : une fiche se quitte par
 * un retour vers le catalogue, mais un résultat de recherche arrive sans
 * contexte.
 */
export function breadcrumbJsonLd(
  steps: readonly BreadcrumbStep[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: steps.map((step, index) => ({
      "@type": "ListItem",
      /* schema.org compte les positions à partir de 1. */
      position: index + 1,
      name: step.name,
      item: absoluteUrl(step.path),
    })),
  };
}
