import { site } from "@/data/site";
import { toPlainText } from "@/lib/sanitize";
import { absoluteUrl } from "@/lib/site-url";
import type { Artwork } from "@/types/artwork";

/**
 * Données structurées schema.org.
 *
 * POURQUOI EN PLUS DES MÉTADONNÉES : `<title>` et `<meta description>` disent à
 * un moteur de recherche comment ANNONCER la page ; schema.org lui dit ce
 * qu'elle CONTIENT. C'est la différence entre un résultat en deux lignes de
 * texte et une fiche qui affiche l'adresse du musée, ses horaires du jour et
 * l'auteur d'une toile. Aucun visiteur ne lit ce balisage, et c'est pourtant lui
 * qui décide de la tête du résultat de recherche.
 *
 * Les objets sont construits ICI plutôt que dans les pages, pour la même raison
 * que `lib/stats.ts` : ce sont des fonctions pures, elles se relisent sans
 * monter un composant, et les pages restent des assemblages.
 *
 * `undefined` est utilisé librement pour les champs absents — `JSON.stringify`
 * les retire. Un `"creator": null` dans le balisage vaudrait « cette œuvre n'a
 * pas d'auteur », ce qui est une affirmation, là où l'absence du champ dit
 * seulement qu'on ne sait pas.
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
 * Le musée en tant qu'INSTITUTION — à poser une seule fois, sur l'accueil.
 *
 * Répété sur chaque page, ce bloc ne dirait rien de plus : c'est une description
 * du lieu, pas de la page. L'accueil est l'adresse que Google retient comme
 * représentant le site.
 */
export function museumJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Museum",
    name: site.name,
    description: site.description,
    url: absoluteUrl("/"),
    /* L'image de partage générée par `app/opengraph-image.tsx` : une seule
       image à produire pour les réseaux sociaux ET pour le balisage. */
    image: absoluteUrl("/opengraph-image"),
    address: postalAddress,
    foundingDate: String(site.openedIn),
    /* Les plages fermées sont écartées : schema.org ne déclare que l'ouverture,
       un jour absent de la liste est un jour fermé. Voir `data/site.ts`. */
    openingHoursSpecification: site.openingHours
      .map((slot) => slot.schedule)
      .filter((schedule) => schedule !== null)
      .map((schedule) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [...schedule.dayOfWeek],
        opens: schedule.opens,
        closes: schedule.closes,
      })),
    /* Le musée EST son catalogue : on rattache explicitement la collection, ce
       qui relie les 39 fiches ci-dessous à l'institution. */
    hasPart: {
      "@type": "Collection",
      name: `Collection du ${site.name}`,
      url: absoluteUrl("/collection"),
    },
  };
}

/**
 * Une œuvre — à poser sur `/collection/[slug]`.
 *
 * `VisualArtwork` plutôt que `CreativeWork`, plus général : c'est le type qui
 * porte `artform` et `artMedium`, donc celui qui permet de dire « peinture »
 * plutôt que « contenu ».
 */
export function artworkJsonLd(artwork: Artwork): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: artwork.title,
    url: absoluteUrl(`/collection/${artwork.slug}`),
    /* La description de l'API est du HTML : les balises n'ont rien à faire dans
       du balisage destiné à une machine, et `toPlainText` tronque déjà
       proprement pour les métadonnées. */
    description: artwork.description
      ? toPlainText(artwork.description)
      : undefined,
    image: artwork.media?.src,
    creator: artwork.artist
      ? { "@type": "Person", name: artwork.artist }
      : undefined,
    /* `dateCreated` attend une date ISO ; une année seule en est une valide, et
       c'est tout ce que l'API donne. */
    dateCreated: artwork.year ? String(artwork.year) : undefined,
    /* `artform` = la nature de l'objet ("painting", "fresco"), telle que l'API
       la donne. `genre` accueille le mouvement : schema.org n'a pas de propriété
       « mouvement artistique », et `genre` est le champ libre prévu pour ce
       genre de classement. */
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
 * Fil d'Ariane — le balisage qui remplace l'URL brute par un chemin lisible
 * sous le résultat de recherche (« Musée des Mouvements › Collection › La Nuit
 * étoilée »).
 *
 * Le site n'affiche pas de fil d'Ariane à l'écran, et c'est ici une différence
 * assumée : la navigation d'une fiche se fait par un retour vers le catalogue,
 * mais un résultat de recherche, lui, arrive sans contexte. Le balisage donne
 * ce contexte-là.
 */
export function breadcrumbJsonLd(
  steps: readonly BreadcrumbStep[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: steps.map((step, index) => ({
      "@type": "ListItem",
      /* 1-indexé : schema.org compte les positions à partir de 1, pas de 0. */
      position: index + 1,
      name: step.name,
      item: absoluteUrl(step.path),
    })),
  };
}
