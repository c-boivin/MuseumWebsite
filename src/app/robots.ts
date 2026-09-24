import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";

/**
 * `/robots.txt`, généré au build.
 *
 * Fichier spécial de l'App Router : Next appelle cette fonction une fois et
 * écrit le fichier. L'URL du sitemap suit donc le domaine de déploiement.
 *
 * Deux interdictions seulement : `/compte/`, pour ne pas faire dépenser au robot
 * son budget d'exploration sur une redirection vers la connexion, et `/api/`,
 * dont les réponses JSON n'ont rien à faire dans les résultats de recherche.
 *
 * `/connexion`, `/inscription` et `/mot-de-passe-oublie` ne sont délibérément
 * PAS interdits : elles portent déjà `robots: { index: false }`, et les deux
 * mécanismes se contrarient — un robot qui a interdiction d'explorer une page ne
 * lit jamais son `noindex`, et peut la garder indexée sur la foi d'un lien
 * externe. `Disallow` économise l'exploration, `noindex` retire de l'index : on
 * ne les empile pas sur la même URL.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/compte/", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    /* Pas de `host` : la directive est une extension de Yandex que Google
       ignore, et elle attend un nom de domaine nu là où `absoluteUrl` produit
       une URL complète. Le domaine de référence est déjà dit là où c'est
       standard, dans les `<link rel="canonical">`. */
  };
}
