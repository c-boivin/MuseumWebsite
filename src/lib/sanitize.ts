/**
 * Balises conservées dans les textes riches de l'API.
 *
 * Liste blanche volontairement courte : les descriptions de l'API Museum
 * n'utilisent que de la mise en forme de paragraphe. Tout ce qui n'est pas ici
 * est retiré, y compris <a> — un lien injecté dans un contenu tiers est un
 * vecteur d'hameçonnage, et aucune description n'en a besoin.
 */
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "blockquote",
]);

/**
 * Supprime les balises dont le CONTENU est dangereux, ce contenu compris.
 *
 * Étape commune aux deux fonctions du fichier. Retirer seulement les balises
 * laisserait `alert(1)` traîner comme texte : sans danger dans le corps de la
 * page, mais ça remontait jusque dans la `<meta description>` — donc dans les
 * résultats de recherche et les aperçus de partage.
 */
function stripDangerousBlocks(html: string): string {
  return html.replace(
    /<(script|style|iframe|object|embed)\b[\s\S]*?<\/\1>/gi,
    "",
  );
}

/**
 * Nettoie une chaîne HTML venue de l'API avant de l'injecter dans la page.
 *
 * POURQUOI : le champ `description` de l'API contient du HTML, et l'afficher
 * impose `dangerouslySetInnerHTML`. Sans filtre, quiconque contrôle l'API
 * exécuterait du JavaScript chez nos visiteurs (faille XSS). On ne fait pas
 * confiance à une source qu'on ne maîtrise pas, même fournie par le cours.
 *
 * LIMITE À CONNAÎTRE : un nettoyage à l'expression régulière n'est pas
 * infaillible face à du HTML volontairement malformé. Sur un site en production
 * on brancherait une vraie bibliothèque (DOMPurify). Ici, la liste blanche + la
 * suppression de tous les attributs couvrent les vecteurs réalistes, sans ajouter
 * de dépendance pour un projet d'école.
 */
export function sanitizeRichText(html: string): string {
  return (
    stripDangerousBlocks(html)
      /* La balise autorisée est réécrite sans le moindre attribut (exit
         `onclick`, `href`, `src`) ; les autres disparaissent en laissant leur
         texte. */
      .replace(/<\/?([a-z0-9-]+)\b[^>]*>/gi, (match, rawName: string) => {
        const name = rawName.toLowerCase();
        if (!ALLOWED_TAGS.has(name)) return "";
        return match.startsWith("</") ? `</${name}>` : `<${name}>`;
      })
      .trim()
  );
}

/**
 * Réduit une chaîne HTML à du texte brut, tronqué proprement.
 *
 * Sert aux métadonnées : une balise <meta name="description"> ne peut pas
 * contenir de HTML, et Google coupe autour de 160 caractères. On coupe donc
 * nous-mêmes, sur un espace, pour ne pas laisser un mot à moitié.
 */
export function toPlainText(html: string, maxLength = 160): string {
  const text = stripDangerousBlocks(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;

  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}
