"use client";

import { useActionState, useEffect } from "react";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { AuthAction } from "@/types/auth";

interface AccountFormProps {
  /**
   * L'action serveur du bloc. Elle arrive en prop depuis un Server Component :
   * React ne transmet pas la fonction mais une RÉFÉRENCE vers elle, son corps ne
   * part jamais dans le bundle.
   */
  action: AuthAction;
  submitLabel: string;
  /** Les champs, rendus sur le serveur par la page et traversant ce composant. */
  children: React.ReactNode;
  variant?: "primary" | "danger";
  /**
   * Appelé une fois que le serveur a répondu un succès.
   *
   * N'existe que pour la suppression de compte, qui doit recharger la page
   * ensuite. Il ne peut venir que d'un composant CLIENT — une fonction ordinaire
   * ne franchit pas la frontière serveur — d'où `account/DeleteAccountPanel`,
   * qui est le seul appelant à en être un.
   */
  onSuccess?: () => void;
}

/**
 * Le câblage commun aux formulaires de l'espace compte : envoi, message du
 * serveur, bouton qui reste éteint tant que rien n'est valide.
 *
 * ── LE PENDANT CLAIR DE `sections/AuthForm` ──
 * Même rôle, même mécanique, deux fonds. Les fusionner en un seul composant à
 * prop `surface` aurait été tentant : ils divergent pourtant sur le fond comme
 * sur la forme — celui-là centre son bouton sous un monogramme et vit seul sur
 * sa page, celui-ci est répété trois fois dans une colonne et aligne ses boutons
 * à gauche. Ce qu'ils partagent vraiment est déjà extrait : `ui/FormMessage` et
 * `ui/SubmitButton`.
 *
 * ── LES CHAMPS NE FRANCHISSENT PAS LA FRONTIÈRE CLIENT ──
 * Ils traversent en `children`, rendus par la page côté serveur. La partie
 * cliente se limite donc à l'état de la réponse — et `ui/Field` reste, lui, un
 * composant non contrôlé : la saisie appartient au navigateur.
 */
export function AccountForm({
  action,
  submitLabel,
  children,
  variant = "primary",
  onSuccess,
}: AccountFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    if (state?.tone === "success") onSuccess?.();
    /* `state` et non `state.tone` : chaque réponse du serveur est un NOUVEL
       objet, y compris quand son contenu est identique. Deux suppressions
       réussies d'affilée — impossible en pratique, mais deux enregistrements
       réussis d'affilée, non — déclencheraient donc bien deux fois l'effet. */
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="mt-8 space-y-8">
      {children}

      {/* Sous les champs, au-dessus du bouton : le chemin du regard entre ce
          qu'on vient de taper et ce qu'on s'apprête à recliquer. */}
      <FormMessage state={state} />

      <SubmitButton
        variant={variant}
        size="sm"
        /* ÉTEINT PENDANT L'ENVOI : sans ça, deux clics rapides envoient deux
           demandes. Sur un changement de mot de passe, la seconde arrive avec
           un mot de passe actuel qui vient de changer — donc un refus affiché
           sur une opération qui a pourtant réussi. */
        disabled={isPending}
        wrapperClassName="flex"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
