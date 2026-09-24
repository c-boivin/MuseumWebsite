import type { JsonLdObject } from "@/lib/structured-data";

interface JsonLdProps {
  /** L'objet schema.org à publier. Voir `lib/structured-data.ts`. */
  data: JsonLdObject;
}

/**
 * Publie un bloc de données structurées dans la page.
 *
 * Ne rend RIEN de visible : une balise `<script type="application/ld+json">`
 * n'est ni affichée ni exécutée par le navigateur, elle est seulement lue par
 * les moteurs de recherche. Elle peut donc être posée n'importe où dans la page
 * — on la met en tête du contenu, là où on la retrouve en lisant le composant.
 *
 * Composant `ui/` et non `artwork/` : il ne sait rien du musée, il sérialise un
 * objet. Ce sont les fonctions de `lib/structured-data.ts` qui connaissent le
 * métier.
 *
 * LE `.replace()` N'EST PAS DÉCORATIF. Les descriptions viennent de l'API, donc
 * d'une source qu'on ne maîtrise pas — même position que `lib/sanitize.ts`. Une
 * chaîne contenant `</script>` fermerait la balise depuis l'intérieur du JSON
 * et laisserait le reste s'exécuter comme du JavaScript. Échapper le `<` en
 * `\u003c` rend la séquence impossible à écrire : c'est toujours du JSON
 * valide, et ça ne peut plus fermer la balise.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: seule façon d'écrire du JSON-LD ; l'échappement juste au-dessus couvre l'injection.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\u003c"),
      }}
    />
  );
}
