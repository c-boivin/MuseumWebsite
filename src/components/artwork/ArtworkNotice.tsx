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
 * ── POURQUOI CE BLOC EXISTE ──
 * Le champ `description` de l'API était CHARGÉ mais jamais affiché : il ne
 * servait qu'à fabriquer la `<meta description>` et le JSON-LD. Les 39 œuvres en
 * ont une, de 900 à 2 000 caractères — le contenu le plus riche que l'API
 * fournisse, et le sujet demande une fiche « qui recoupe toutes ses données ».
 * Le cartel dit ce qu'est l'œuvre ; la notice dit pourquoi on s'y arrête.
 *
 * ── LE TEXTE RESTE EN ANGLAIS, ET C'EST LA RÈGLE DU SITE ──
 * Les données de l'API ne sont pas traduites : un titre d'œuvre est un nom
 * propre, une notice est le texte du musée. Seule l'interface autour est en
 * français. Traduire à la volée supposerait un service de traduction, et surtout
 * ferait dire au musée des choses qu'il n'a pas écrites.
 *
 * ── `dangerouslySetInnerHTML` EST ICI UN CHOIX, PAS UNE FACILITÉ ──
 * La description contient du balisage (`<p>`, `<strong>`, `<em>`) : l'afficher
 * en texte brut l'écraserait en un pavé, et afficher les balises serait pire.
 * La seule façon de rendre du HTML reçu à l'exécution, c'est celle-là — d'où le
 * passage OBLIGATOIRE par `sanitizeRichText`, qui réduit le contenu à une liste
 * blanche de balises et supprime tous les attributs. On ne fait pas confiance à
 * une source qu'on ne maîtrise pas, même fournie par le cours.
 *
 * La mise en forme du résultat vit dans l'utilitaire `rich-text` de
 * `globals.css` : ces balises-là n'existent dans aucun fichier .tsx, elles ne
 * peuvent donc pas porter de className.
 *
 * Server Component : rien ici ne demande le navigateur, et le nettoyage se fait
 * une fois au build plutôt qu'à chaque affichage.
 */
export function ArtworkNotice({ description, id }: ArtworkNoticeProps) {
  const html = sanitizeRichText(description);

  /* Une description qui ne contiendrait que des balises interdites ressortirait
     vide du nettoyage. Un titre de section suivi de rien serait pire que rien. */
  if (html.length === 0) return null;

  return (
    <Section id={id} tone="surface">
      {/* Titre à gauche, texte à droite : la disposition d'un panneau de salle,
          et la seule qui occupe les 90rem du site sans étirer les lignes de
          texte. Le bloc de droite reste borné à `max-w-reading` — au-delà d'une
          soixantaine de caractères par ligne, l'œil perd le début de la
          suivante. */}
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
          // biome-ignore lint/security/noDangerouslySetInnerHtml: le HTML est passé par sanitizeRichText juste au-dessus — c'est le seul moyen de rendre le balisage d'une notice, voir la documentation du composant
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </Section>
  );
}
