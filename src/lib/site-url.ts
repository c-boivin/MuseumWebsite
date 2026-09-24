/**
 * URL publique du site, en absolu.
 *
 * Une constante plutôt qu'un `process.env` lu sur place : trois fichiers en
 * dépendent — sitemap, robots, `metadataBase` — et une variable absente y
 * produirait trois pannes silencieuses. Aucune ne casse le build, toutes cassent
 * le référencement.
 *
 * L'ordre des replis, du plus juste au plus pauvre :
 *
 * 1. `NEXT_PUBLIC_SITE_URL` — le domaine du musée, à poser dans les variables
 *    Vercel. Seule valeur juste en production.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — fourni sur tous les déploiements et
 *    désignant toujours la production : le filet qui évite qu'un oubli parte en
 *    ligne avec un sitemap inutilisable. Surtout pas `VERCEL_URL`, qui change à
 *    chaque push et ferait entrer des adresses jetables dans le sitemap. Vercel
 *    les fournit sans protocole, d'où le `https://`.
 * 3. `http://localhost:3000` — en `http`, sinon `metadataBase` fabrique des URL
 *    `https://localhost` injoignables.
 */
function resolveSiteUrl(): string {
  /* Lecture en toutes lettres : Next remplace `process.env.NEXT_PUBLIC_*` par sa
     valeur au build, textuellement. Un accès calculé ne serait pas remplacé et
     vaudrait `undefined` dans le navigateur. */
  const declared = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (declared) {
    /* Une barre oblique finale recopiée depuis la barre d'adresse produirait des
       `//collection` dans le sitemap. */
    return declared.replace(/\/+$/, "");
  }

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

/**
 * Chemin interne → URL absolue. Passe par `new URL` plutôt qu'une concaténation :
 * l'objet normalise les barres obliques en trop et refuse une base invalide en
 * levant au build.
 */
export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl).toString();
}
