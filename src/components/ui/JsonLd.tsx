import type { JsonLdObject } from "@/lib/structured-data";

interface JsonLdProps {
  /** L'objet schema.org à publier. Voir `lib/structured-data.ts`. */
  data: JsonLdObject;
}

/**
 * Publie un bloc de données structurées dans la page.
 *
 * Ne rend rien de visible : un `<script type="application/ld+json">` n'est ni
 * affiché ni exécuté, il est seulement lu par les moteurs de recherche.
 *
 * Composant `ui/` et non `artwork/` : il ne sait rien du musée, il sérialise un
 * objet.
 *
 * Le `.replace()` n'est pas décoratif : les descriptions viennent de l'API, et
 * une chaîne contenant `</script>` fermerait la balise depuis l'intérieur du
 * JSON. Échapper le `<` rend la séquence impossible à écrire.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: seule façon d'écrire du JSON-LD ; l'échappement couvre l'injection.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\u003c"),
      }}
    />
  );
}
