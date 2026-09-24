import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";

/**
 * `/robots.txt`, généré au build.
 *
 * Fichier spécial de l'App Router : Next appelle cette fonction une fois et
 * écrit le fichier. On ne le maintient donc pas à la main, et l'URL du sitemap
 * suit automatiquement le domaine de déploiement (voir `lib/site-url.ts`).
 *
 * CE QUI EST INTERDIT, ET POURQUOI SI PEU DE CHOSES :
 *
 * - `/compte/` — l'espace personnel. Un robot n'y verrait de toute façon que la
 *   redirection vers la connexion posée par `app/compte/layout.tsx`, mais
 *   autant ne pas lui faire dépenser son budget d'exploration pour ça.
 * - `/api/` — la route de Better Auth. Ce ne sont pas des pages ; indexées,
 *   elles apporteraient des réponses JSON dans les résultats de recherche.
 *
 * CE QUI N'EST DÉLIBÉRÉMENT PAS INTERDIT : `/connexion`, `/inscription` et
 * `/mot-de-passe-oublie`. Ces trois pages portent déjà `robots: { index: false }`
 * dans leurs métadonnées, et les DEUX mécanismes se contrarient — un robot qui a
 * interdiction d'explorer une page ne lit jamais la balise `noindex` qu'elle
 * contient, et peut donc la garder indexée sur la foi d'un lien externe. Pour
 * faire disparaître une page de l'index, il faut au contraire la laisser
 * explorer. `Disallow` sert à économiser l'exploration, `noindex` à retirer de
 * l'index : on ne les empile pas sur la même URL.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/compte/", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    /* PAS de `host`. Next sait l'écrire, mais la directive est une extension de
       Yandex que Google ignore, et elle attend un nom de domaine nu là où
       `absoluteUrl` produit une URL complète — on annoncerait donc une valeur
       invalide à celui-là même qui la lit. Le domaine de référence est déjà dit
       là où c'est standard : les `<link rel="canonical">` des pages. */
  };
}
