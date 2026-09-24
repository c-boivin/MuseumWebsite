import { Logo } from "@/components/layout/Logo";
import { FadeIn } from "@/components/motion/FadeIn";
import { Section } from "@/components/ui/Section";
import type { AuthAction } from "@/types/auth";
import { AuthForm } from "./AuthForm";
import { AuthLinks } from "./AuthLinks";

interface AuthPanelProps {
  /**
   * Titre de la page. Il n'est pas affiché — voir le <h1> en `sr-only` plus
   * bas — mais reste obligatoire : c'est lui qui donne son titre au document
   * pour les technologies d'assistance.
   */
  title: string;
  /**
   * Phrase sous le titre, rarement utile : sur un formulaire de connexion, deux
   * champs nommés disent déjà tout. Elle sert au mot de passe oublié, où il faut
   * annoncer ce qui va se passer après l'envoi.
   */
  lead?: string;
  /** Les champs du formulaire, passés par la page. */
  children: React.ReactNode;
  submitLabel: string;
  /**
   * Ce que fait la page quand on valide. Les trois actions ont la même
   * signature, c'est ce qui permet à ce panneau de servir aux trois.
   *
   * Obligatoire même sur la page qui ne fait rien : un `<form>` sans `action`
   * est soumis en GET sur l'URL courante, donc le mot de passe en clair dans la
   * barre d'adresse, l'historique et les journaux du serveur. Une page de compte
   * sans action n'est pas une maquette inoffensive, c'est une fuite.
   */
  action: AuthAction;
  /** Parcours voisins, sous le bouton : créer un compte, mot de passe oublié… */
  links?: { label: string; href: string }[];
}

/**
 * Le bloc des pages de compte : monogramme, formulaire, parcours voisins.
 *
 * Un seul composant pour les trois pages, qui ne diffèrent que par trois props.
 * Trois composants séparés auraient garanti qu'une retouche n'en rattrape que
 * deux sur trois.
 *
 * Fond sombre à rebours du reste du site : ce n'est pas un écart de style, c'est
 * ce que la page raconte. Le noir est celui du Header et du Footer, les deux
 * surfaces qui appartiennent à l'institution et non aux œuvres.
 *
 * Aucune œuvre ici : une toile derrière un formulaire ne se regarde pas, elle
 * décore. Le monogramme suffit à dire où l'on est, d'où sa taille.
 *
 * Server Component, et il le reste : `FadeIn` et `AuthForm` isolent chacun leur
 * besoin de navigateur.
 */
export function AuthPanel({
  title,
  lead,
  children,
  submitLabel,
  action,
  links,
}: AuthPanelProps) {
  return (
    /* `spacing="none"` : le rythme vertical des sections n'a pas de sens ici, le
       bloc ne contient qu'une carte centrée. */
    <Section tone="ink" height="screen" spacing="none">
      {/* `m-auto` et non `mx-auto` : la Section plein écran fait de son Container
          une colonne flex, la marge automatique centre donc aussi verticalement.
          Le fondu enveloppe tout, pour que la page arrive d'une seule pièce. */}
      <FadeIn className="m-auto w-full max-w-sm">
        <div className="flex flex-col items-center gap-8 text-center">
          <Logo className="size-24" />

          {/* Invisible mais présent : à l'écran il répétait le formulaire
              au-dessus du formulaire, mais le supprimer laissait une page sans
              aucun <h1> — plus rien n'annoncerait sur quelle page on arrive.

              Il ne compte pas dans le `gap-8` : `sr-only` le positionne en
              absolu, il cesse donc d'être un élément flex. */}
          <h1 className="sr-only">{title}</h1>

          {/* Plus de `-mt-4` : cette marge rattrapait le `gap-8` pour coller le
              chapeau à son titre. Le titre n'étant plus visible, elle remontait
              le texte contre le monogramme. */}
          {lead && (
            <p className="text-balance text-paper/60 text-sm leading-relaxed">
              {lead}
            </p>
          )}
        </div>

        {/* Seule partie cliente du panneau, sortie dans son fichier pour ça. Les
            champs ne franchissent pas la frontière : ils sont rendus par la page
            et traversent en `children`. */}
        <AuthForm action={action} submitLabel={submitLabel}>
          {children}
        </AuthForm>

        {/* Clients pour une seule raison : ils doivent conserver la question
            posée dans l'URL, sans quoi passer de la connexion à l'inscription
            perd l'intention en chemin. */}
        {links && links.length > 0 && <AuthLinks links={links} />}
      </FadeIn>
    </Section>
  );
}
