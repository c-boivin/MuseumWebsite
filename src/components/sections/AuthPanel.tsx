import { Logo } from "@/components/layout/Logo";
import { FadeIn } from "@/components/motion/FadeIn";
import { Section } from "@/components/ui/Section";
import type { AuthAction } from "@/types/auth";
import { AuthForm } from "./AuthForm";
import { AuthLinks } from "./AuthLinks";

interface AuthPanelProps {
  /**
   * Titre de la page : « Connexion », « Créer un compte »…
   *
   * IL N'EST PAS AFFICHÉ — voir le <h1> plus bas, qui le porte en `sr-only`.
   * La prop reste obligatoire pour autant : c'est elle qui donne son titre au
   * document pour les technologies d'assistance.
   */
  title: string;
  /**
   * Phrase d'explication sous le titre. Optionnelle, et rarement utile : sur un
   * formulaire de connexion, deux champs nommés disent déjà tout. Elle sert là
   * où le formulaire ne se suffit pas — le mot de passe oublié, où il faut
   * annoncer ce qui va se passer après l'envoi.
   */
  lead?: string;
  /** Les champs du formulaire, passés par la page. */
  children: React.ReactNode;
  submitLabel: string;
  /**
   * Ce que fait la page quand on valide : connexion, inscription, ou le refus
   * assumé du mot de passe oublié. Toutes trois ont la même signature (voir
   * `types/auth`), c'est ce qui permet à ce panneau de servir aux trois.
   *
   * ELLE EST OBLIGATOIRE, même sur la page qui ne fait rien. Un `<form>` sans
   * `action` est soumis par le navigateur en GET sur l'URL courante : valider
   * la connexion enverrait donc le visiteur sur `/connexion?email=…&password=…`
   * — le mot de passe en clair dans la barre d'adresse, dans l'historique et
   * dans les journaux du serveur. Une page de compte sans action n'est pas une
   * maquette inoffensive, c'est une fuite.
   */
  action: AuthAction;
  /** Parcours voisins, sous le bouton : créer un compte, mot de passe oublié… */
  links?: { label: string; href: string }[];
}

/**
 * Le bloc des pages de compte : monogramme, formulaire, parcours voisins.
 *
 * UN SEUL COMPOSANT POUR LES TROIS PAGES — connexion, inscription, mot de passe
 * oublié. Elles ne diffèrent que par leur titre, leurs champs et leurs liens :
 * trois props. Trois composants séparés auraient surtout garanti qu'une retouche
 * du monogramme ou de l'espacement n'en rattrape que deux sur trois.
 *
 * FOND SOMBRE SUR TOUTE LA HAUTEUR, à rebours du reste du site qui est clair.
 * Ce n'est pas un écart de style, c'est ce que la page raconte : on quitte les
 * salles pour entrer dans un espace privé. Le noir est déjà celui du Header et
 * du Footer — les deux surfaces qui appartiennent à l'institution et non aux
 * œuvres. Les pages de compte en font partie.
 *
 * Aucune œuvre ici, et c'est délibéré : toutes les autres pages s'ouvrent sur
 * une reproduction (`Hero`). Une toile derrière un formulaire ne se regarde pas,
 * elle décore — ce que ce musée ne fait pas. Le monogramme suffit à dire où l'on
 * est, et c'est pour ça qu'il est grand.
 *
 * Server Component, et il le reste : les deux parties qui ont besoin du
 * navigateur sont isolées chacune dans son fichier — `FadeIn` pour le fondu
 * d'arrivée, `AuthForm` pour l'envoi et le message du serveur. Le monogramme,
 * le titre et les liens ne partent pas dans le bundle.
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
       bloc ne contient qu'une carte centrée. `height="screen"` la centre et fait
       que rien ne dépasse — la page ne contient que ça. */
    <Section tone="ink" height="screen" spacing="none">
      {/* `m-auto` et non `mx-auto` : la Section plein écran fait de son Container
          une colonne flex, donc la marge automatique centre aussi verticalement.

          Le fondu enveloppe TOUT le bloc, monogramme compris, pour que la page
          arrive d'une seule pièce. */}
      <FadeIn className="m-auto w-full max-w-sm">
        <div className="flex flex-col items-center gap-8 text-center">
          <Logo className="size-24" />

          {/* TITRE PRÉSENT MAIS INVISIBLE, et c'est la seule façon de le retirer
              sans casser la page. À l'écran il ne servait à rien : le bouton
              dit déjà « Se connecter » ou « Créer mon compte », et les deux
              champs nommés disent le reste — le titre répétait le formulaire
              au-dessus du formulaire.

              Mais le supprimer POUR DE BON laissait une page sans aucun <h1> :
              un lecteur d'écran qui liste les titres pour se repérer n'aurait
              plus rien trouvé, et rien n'aurait annoncé sur quelle page on
              arrive. `sr-only` le retire de l'affichage en le gardant dans le
              document — l'utilitaire est déjà celui du lien d'évitement du root
              layout.

              Il ne compte pas non plus dans le `gap-8` du conteneur : `sr-only`
              le positionne en absolu, il cesse donc d'être un élément flex. */}
          <h1 className="sr-only">{title}</h1>

          {/* Plus de `-mt-4` ici : cette marge négative rattrapait le `gap-8`
              pour coller le chapeau à son titre. Le titre n'étant plus visible,
              elle remontait le texte contre le monogramme. */}
          {lead && (
            <p className="text-balance text-paper/60 text-sm leading-relaxed">
              {lead}
            </p>
          )}
        </div>

        {/* LE FORMULAIRE EST LA SEULE PARTIE CLIENTE DE CE PANNEAU, et il est
            sorti dans son propre fichier pour ça. Afficher un refus du serveur
            — « mot de passe incorrect » — demande un état React ; le garder ici
            aurait rendu client le monogramme, le titre et les liens, c'est-à-dire
            toute la page, pour une phrase.

            Les champs, eux, ne franchissent pas la frontière : ils sont rendus
            par la page côté serveur et traversent `AuthForm` en `children`. */}
        <AuthForm action={action} submitLabel={submitLabel}>
          {children}
        </AuthForm>

        {/* LES LIENS VOISINS SONT CLIENTS, et pour une seule raison : ils
            doivent conserver la question posée dans l'URL — d'où vient le
            visiteur, et quelle œuvre il voulait mettre de côté. Sans ça, passer
            de la connexion à l'inscription perd l'intention en chemin. Voir
            `sections/AuthLinks`. */}
        {links && links.length > 0 && <AuthLinks links={links} />}
      </FadeIn>
    </Section>
  );
}
