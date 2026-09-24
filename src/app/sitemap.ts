import type { MetadataRoute } from "next";
import { getArtworkSlugs } from "@/lib/museum";
import { absoluteUrl } from "@/lib/site-url";

/**
 * `/sitemap.xml`, généré au build.
 *
 * `force-static` parce que cette fonction appelle l'API : sans lui, Next verrait
 * un `fetch` et pourrait servir le sitemap à la demande, c'est-à-dire un aller
 * jusqu'à l'API du musée à chaque passage d'un robot. Le catalogue bouge une
 * fois par an ; le sitemap sort du build et n'en rebouge plus.
 */
export const dynamic = "force-static";

/**
 * Les pages écrites à la main, avec leur importance relative.
 *
 * `priority` ne pèse rien d'absolu — Google ne compare pas notre 0.9 à celui
 * d'un autre site. Il HIÉRARCHISE nos propres pages entre elles : on dit ici que
 * la collection compte plus que la page À propos, et `changeFrequency` que le
 * catalogue bouge plus souvent que l'adresse du musée.
 *
 * NE PAS Y AJOUTER `/connexion`, `/inscription`, `/mot-de-passe-oublie` ni
 * `/compte/…`. Un sitemap est une liste de pages qu'on VEUT voir indexées ;
 * y faire figurer des pages en `noindex` envoie deux consignes contradictoires
 * au robot, et c'est exactement ce que la Search Console signale en erreur.
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
  /* UNE SEULE DATE pour tout le fichier, et c'est celle du build. Un
     `new Date()` recalculé ligne par ligne daterait chaque œuvre de l'instant
     où la boucle est passée dessus — une précision inventée. Le site étant
     entièrement pré-généré, la date du build est la vraie date de dernière
     publication du contenu. */
  const lastModified = new Date();

  /* LE CATALOGUE NE DOIT PAS POUVOIR FAIRE ÉCHOUER LE BUILD. `sitemap.ts` étant
     statique, une API en panne au moment du déploiement emporterait toute la
     compilation — pour un fichier annexe. On publie alors le sitemap des pages
     fixes, quitte à ce que les 39 fiches y entrent au déploiement suivant.
     Même arbitrage que la page À propos, qui survit à une panne de l'API. */
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

    /* Aucun `slugify` à écrire ici, contrairement au modèle du cours : l'API
       expose déjà un champ `slug`, et c'est LUI qui sert de clé d'URL à
       `/collection/[slug]`. Recalculer un slug à partir du titre ferait du
       sitemap une seconde source de vérité — et la première divergence entre
       les deux (une apostrophe, un chiffre romain) mettrait une 404 dans le
       sitemap sans que rien ne le signale. */
    ...slugs.map((slug) => ({
      url: absoluteUrl(`/collection/${slug}`),
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
