import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { sanitizeRichText } from "@/lib/sanitize";

interface ArtworkNoticeProps {
  /** Le champ `description` de l'API — du HTML, pas du texte brut. */
  description: string;
  /** Cible du lien « Lire la notice » posé en haut de la fiche. */
  id: string;
}

/**
 * La notice de l'œuvre : le texte du panneau accroché à côté du cartel.
 *
 * Le champ `description` était chargé mais jamais affiché — il ne servait qu'à
 * la `<meta description>` et au JSON-LD. Les 39 œuvres en ont une, de 900 à
 * 2 000 caractères : le contenu le plus riche que l'API fournisse. Le cartel dit
 * ce qu'est l'œuvre, la notice dit pourquoi on s'y arrête.
 *
 * Le texte reste en anglais, comme toutes les données de l'API : traduire à la
 * volée supposerait un service de traduction, et surtout ferait dire au musée
 * des choses qu'il n'a pas écrites.
 *
 * `dangerouslySetInnerHTML` est ici un choix : la description contient du
 * balisage, l'afficher en texte brut l'écraserait en un pavé. D'où le passage
 * obligatoire par `sanitizeRichText`, qui réduit le contenu à une liste blanche
 * et supprime tous les attributs.
 *
 * La mise en forme vit dans l'utilitaire `rich-text` de globals.css : ces
 * balises n'existent dans aucun .tsx, elles ne peuvent pas porter de className.
 *
 * Server Component : le nettoyage se fait une fois au build.
 */
export function ArtworkNotice({ description, id }: ArtworkNoticeProps) {
  const html = sanitizeRichText(description);

  /* Une description qui ne contiendrait que des balises interdites ressortirait
     vide. Un titre de section suivi de rien serait pire que rien. */
  if (html.length === 0) return null;

  return (
    <Section id={id} tone="surface">
      {/* Titre à gauche, texte à droite : la disposition d'un panneau de salle,
          et la seule qui occupe les 90rem du site sans étirer les lignes. Le
          bloc de droite reste borné à `max-w-reading` — au-delà d'une soixantaine
          de caractères, l'œil perd le début de la ligne suivante. */}
      <div className="grid grid-cols-[1fr_2fr] gap-16">
        <div className="space-y-3">
          <p className="eyebrow text-ink-mute">Notice</p>
          {/* `h2` : la fiche a déjà son `h1`, c'est le titre de l'œuvre. */}
          <Heading as="h2" size="heading">
            À propos de cette œuvre
          </Heading>
        </div>

        <div
          className="rich-text max-w-reading"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: le HTML est passé par sanitizeRichText juste au-dessus, seul moyen de rendre le balisage d'une notice
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </Section>
  );
}
