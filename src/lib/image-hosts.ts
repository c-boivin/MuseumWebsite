/**
 * Domaines d'images que le site accepte d'afficher.
 *
 * Une seule liste pour deux usages :
 *
 * 1. `next.config.ts` la donne à `images.remotePatterns`. Sans déclaration,
 *    `next/image` renvoie une 400 — c'est ce qui empêche un site tiers
 *    d'utiliser notre optimiseur comme proxy gratuit.
 * 2. `lib/museum.ts` s'en sert pour vérifier l'URL avant de la transmettre : une
 *    image hébergée ailleurs est écartée à la normalisation.
 *
 * Sans le point 2, une œuvre illustrée depuis un nouveau domaine donnerait une
 * image cassée sans message. Avec, on obtient une dégradation propre, et une
 * ligne ajoutée ici suffit pour accepter le domaine des deux côtés.
 */
export const remoteImagePatterns = [
  { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/**" },
  { protocol: "https", hostname: "www.moma.org", pathname: "/media/**" },
] as const;

/**
 * Reproduit la syntaxe de `pathname` de Next : `**` en fin de motif accepte
 * n'importe quelle suite de segments. Seul cas utilisé ici.
 */
function matchesPathname(pathname: string, pattern: string): boolean {
  if (pattern === "/**") return true;
  return pathname.startsWith(pattern.replace(/\*\*$/, ""));
}

/**
 * Répond `false` pour une URL malformée, un protocole autre que HTTPS, ou un
 * domaine absent de la liste. Ne dit rien de l'existence réelle du fichier : ça,
 * seul le navigateur le découvrira, d'où le filet dans <Media />.
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
