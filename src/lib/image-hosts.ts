/**
 * Domaines d'images que le site accepte d'afficher.
 *
 * UNE SEULE LISTE POUR DEUX USAGES, et c'est tout l'intérêt du fichier :
 *
 * 1. `next.config.ts` la donne à `images.remotePatterns`. Sans déclaration,
 *    `next/image` refuse l'image et renvoie une 400 — c'est ce qui empêche un
 *    site tiers d'utiliser notre optimiseur d'images comme proxy gratuit.
 * 2. `lib/museum.ts` s'en sert pour VÉRIFIER l'URL avant de la transmettre. Une
 *    image hébergée ailleurs est écartée à la normalisation, et l'œuvre
 *    s'affiche avec son cadre de remplacement.
 *
 * Sans le point 2, le jour où le prof ajoute une œuvre illustrée depuis un
 * nouveau domaine, on obtiendrait une image cassée sans aucun message. Avec, on
 * obtient une dégradation propre — et il suffit d'ajouter une ligne ici pour
 * accepter le nouveau domaine, les deux usages suivent.
 */
export const remoteImagePatterns = [
  { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/**" },
  { protocol: "https", hostname: "www.moma.org", pathname: "/media/**" },
] as const;

/**
 * Reproduit la syntaxe de `pathname` de Next : `**` en fin de motif accepte
 * n'importe quelle suite de segments. On ne gère que ce cas, seul utilisé ici.
 */
function matchesPathname(pathname: string, pattern: string): boolean {
  if (pattern === "/**") return true;
  return pathname.startsWith(pattern.replace(/\*\*$/, ""));
}

/**
 * L'URL pourra-t-elle être affichée par `next/image` ?
 *
 * Répond `false` pour une URL malformée, un protocole autre que HTTPS, ou un
 * domaine absent de la liste. Ne dit rien sur l'existence réelle du fichier :
 * ça, seul le navigateur le découvrira, d'où le filet côté client dans <Media />.
 */
export function isDisplayableImageUrl(src: string): boolean {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }

  return remoteImagePatterns.some(
    (pattern) =>
      url.protocol === `${pattern.protocol}:` &&
      url.hostname === pattern.hostname &&
      matchesPathname(url.pathname, pattern.pathname),
  );
}
