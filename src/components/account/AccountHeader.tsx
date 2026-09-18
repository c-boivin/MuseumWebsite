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
 * ── IL NE PORTE PLUS NI NAVIGATION NI DÉCONNEXION ──
 * Il en avait : une barre reprenant les deux pages de l'espace, et le bouton de
 * sortie. Le menu déroulant du header (`layout/AccountLink`) porte désormais les
 * trois, et les garder ici aurait donné deux façons de faire la même chose à
 * deux endroits de l'écran — dont un bouton de déconnexion en double, qui est
 * précisément celui qu'il ne faut jamais chercher deux fois. Le menu gagne parce
 * qu'il est atteignable depuis N'IMPORTE quelle page, pas seulement une fois
 * déjà arrivé dans son compte.
 *
 * ── CE QU'IL RESTE, ET POURQUOI CE N'EST PAS RIEN ──
 * Trois lignes de mise en page, mais partagées : sur-titre, titre en `display`,
 * chapeau — exactement l'anatomie de `/collection`. Ce n'est pas une coquetterie
 * de cohérence, c'est ce que la page raconte : `/compte` EST une page de
 * collection, celle du visiteur. Un autre gabarit aurait fait croire à un autre
 * type de contenu.
 *
 * ── UN COMPOSANT PLUTÔT QU'UN `layout.tsx` ──
 * Le layout de `/compte` pourrait porter ce bloc, mais il porterait alors le
 * `<h1>` de deux pages différentes : il faudrait soit le même titre partout,
 * soit le faire remonter depuis la page, ce que Next ne permet pas. Le layout ne
 * fait donc qu'une chose — vérifier qu'on a le droit d'être là.
 *
 * Server Component : plus rien ici n'a besoin du navigateur.
 */
export function AccountHeader({ title, lead }: AccountHeaderProps) {
  return (
    <div className="max-w-reading space-y-6">
      <p className="eyebrow text-ink-mute">Votre compte</p>

      {/* `key` : d'une page de l'espace à l'autre, React réutiliserait
          l'instance et tenterait de patcher un titre dont SplitText a remplacé
          les enfants. Même précaution que sur la fiche œuvre. */}
      <TextReveal key={title}>
        <Heading as="h1" size="display">
          {title}
        </Heading>
      </TextReveal>

      <p className="text-ink-soft text-lead">{lead}</p>
    </div>
  );
}
