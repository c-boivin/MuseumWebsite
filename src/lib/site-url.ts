/**
 * URL publique du site, en absolu.
 *
 * POURQUOI UNE CONSTANTE PLUTÔT QU'UN `process.env` LU SUR PLACE : trois
 * fichiers en dépendent — `app/sitemap.ts`, `app/robots.ts` et le
 * `metadataBase` du root layout — et une variable absente y produirait trois
 * pannes différentes, toutes silencieuses. Un `robots.txt` annonçant
 * `undefined/sitemap.xml`, un sitemap rempli d'URLs `undefined/collection/…`,
 * et des balises Open Graph relatives que les réseaux sociaux refusent
 * d'afficher. Aucune ne casse le build, toutes cassent le référencement. On
 * résout donc l'URL une seule fois, avec un repli, et on la documente ici.
 *
 * L'ORDRE DES REPLIS, du plus juste au plus pauvre :
 *
 * 1. `NEXT_PUBLIC_SITE_URL` — le domaine du musée, à poser dans les variables
 *    d'environnement Vercel. SEULE valeur juste en production : c'est la seule
 *    qui désigne le domaine définitif plutôt qu'une adresse technique.
 *
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — le domaine de production attribué par
 *    Vercel (`mon-projet.vercel.app`). Fourni sur TOUS les déploiements, y
 *    compris les previews, et il désigne toujours la production : c'est le
 *    filet qui évite qu'un oubli de variable parte en ligne avec un sitemap
 *    inutilisable. Surtout PAS `VERCEL_URL`, qui est l'URL unique du
 *    déploiement en cours — elle change à chaque push, et ferait entrer des
 *    adresses jetables dans le sitemap. Vercel fournit les deux SANS protocole,
 *    d'où le `https://` ajouté ici.
 *
 * 3. `http://localhost:3000` — le développement local. En `http`, sinon
 *    `metadataBase` fabrique des URLs `https://localhost` injoignables.
 */
function resolveSiteUrl(): string {
  /* Lecture en toutes lettres et non via une variable : Next remplace
     `process.env.NEXT_PUBLIC_*` par sa valeur AU BUILD, textuellement. Un accès
     calculé (`process.env[name]`) ne serait pas remplacé et vaudrait
     `undefined` dans le navigateur. */
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
 * Chemin interne → URL absolue.
 *
 * Passe par `new URL` plutôt que par une concaténation : l'objet normalise les
 * barres obliques en trop et refuse une base invalide en levant une erreur au
 * build, au lieu de laisser une URL tordue se répandre dans le sitemap.
 */
export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl).toString();
}
