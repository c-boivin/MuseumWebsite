import type { MetadataRoute } from "next";
import { getArtworkSlugs } from "@/lib/museum";
import { absoluteUrl } from "@/lib/site-url";

/**
 * `/sitemap.xml`, généré au build.
 *
 * `force-static` parce que cette fonction appelle l'API : sans lui, Next verrait
 * un `fetch` et pourrait servir le sitemap à la demande, donc un aller jusqu'à
 * l'API à chaque passage d'un robot.
 */
export const dynamic = "force-static";

/**
 * Les pages écrites à la main, avec leur importance relative.
 *
 * `priority` ne pèse rien d'absolu — Google ne compare pas notre 0.9 à celui
 * d'un autre site. Il hiérarchise nos propres pages entre elles.
 *
 * Ne pas y ajouter `/connexion`, `/inscription` ni `/compte/…` : un sitemap est
 * une liste de pages qu'on VEUT voir indexées, et y faire figurer des pages en
 * `noindex` envoie deux consignes contradictoires — c'est ce que la Search
 * Console signale en erreur.
 */
const PAGES: readonly {
  path: string;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
}[] = [
  { path: "/", changeFrequency: "monthly", priority: 1 },
  { path: "/collection", changeFrequency: "weekly", priority: 0.9 },
  { path: "/billetterie", changeFrequency: "monthly", priority: 0.8 },
  { path: "/a-propos", changeFrequency: "yearly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* Une seule date pour tout le fichier, celle du build : un `new Date()`
     recalculé ligne par ligne daterait chaque œuvre de l'instant où la boucle
     est passée dessus, soit une précision inventée. */
  const lastModified = new Date();

  /* Le catalogue ne doit pas pouvoir faire échouer le build : `sitemap.ts` étant
     statique, une API en panne au moment du déploiement emporterait toute la
     compilation pour un fichier annexe. On publie alors le sitemap des pages
     fixes, quitte à ce que les 39 fiches y entrent au déploiement suivant. */
  let slugs: string[] = [];
  try {
    slugs = await getArtworkSlugs();
  } catch (error) {
    console.error(
      "Sitemap : catalogue injoignable, seules les pages fixes sont listées.",
      error,
    );
  }

  return [
    ...PAGES.map(({ path, changeFrequency, priority }) => ({
      url: absoluteUrl(path),
      lastModified,
      changeFrequency,
      priority,
    })),

    /* Aucun `slugify` ici, contrairement au modèle du cours : l'API expose déjà
       un champ `slug`, et c'est lui qui sert de clé d'URL. Le recalculer depuis
       le titre ferait du sitemap une seconde source de vérité, et la première
       divergence mettrait une 404 dedans sans que rien ne le signale. */
    ...slugs.map((slug) => ({
      url: absoluteUrl(`/collection/${slug}`),
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
