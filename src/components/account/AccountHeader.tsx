import { TextReveal } from "@/components/motion/TextReveal";
import { Heading } from "@/components/ui/Heading";

interface AccountHeaderProps {
  /** Titre de la page : « Ma collection », « Mon profil ». */
  title: string;
  lead: string;
}

/**
 * L'accroche commune aux pages de l'espace compte.
 *
 * Il portait une barre de navigation et le bouton de déconnexion ; le menu
 * déroulant du header porte désormais les trois, et les garder ici aurait donné
 * deux boutons de déconnexion — précisément celui qu'il ne faut jamais chercher
 * deux fois. Le menu gagne parce qu'il est atteignable depuis n'importe quelle
 * page.
 *
 * Ce qu'il reste : sur-titre, titre en `display`, chapeau — l'anatomie de
 * `/collection`. Ce n'est pas une coquetterie de cohérence, c'est ce que la page
 * raconte : `/compte` EST une page de collection, celle du visiteur.
 *
 * Un composant plutôt qu'un `layout.tsx` : le layout porterait le `<h1>` de deux
 * pages différentes, et Next ne permet pas de le faire remonter depuis la page.
 *
 * Server Component : plus rien ici n'a besoin du navigateur.
 */
export function AccountHeader({ title, lead }: AccountHeaderProps) {
  return (
    <div className="max-w-reading space-y-6">
      <p className="eyebrow text-ink-mute">Votre compte</p>

      {/* `key` : d'une page à l'autre, React réutiliserait l'instance et
          patcherait un titre dont SplitText a remplacé les enfants. Même
          précaution que sur la fiche œuvre. */}
      <TextReveal key={title}>
        <Heading as="h1" size="display">
          {title}
        </Heading>
      </TextReveal>

      <p className="text-ink-soft text-lead">{lead}</p>
    </div>
  );
}
