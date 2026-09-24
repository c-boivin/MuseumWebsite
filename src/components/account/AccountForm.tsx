"use client";

import { useActionState, useEffect } from "react";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { AuthAction } from "@/types/auth";

interface AccountFormProps {
  /**
   * L'action serveur du bloc. React ne transmet pas la fonction mais une
   * référence vers elle : son corps ne part jamais dans le bundle.
   */
  action: AuthAction;
  submitLabel: string;
  /** Les champs, rendus sur le serveur par la page et traversant ce composant. */
  children: React.ReactNode;
  variant?: "primary" | "danger";
  /**
   * Appelé une fois que le serveur a répondu un succès. N'existe que pour la
   * suppression de compte, qui doit recharger la page ensuite — et il ne peut
   * venir que d'un composant client, une fonction ordinaire ne franchissant pas
   * la frontière serveur.
   */
  onSuccess?: () => void;
}

/**
 * Le câblage commun aux formulaires de l'espace compte : envoi, message du
 * serveur, bouton éteint tant que rien n'est valide.
 *
 * Le pendant clair de `sections/AuthForm`. Les fusionner en un composant à prop
 * `surface` était tentant, mais ils divergent : celui-là centre son bouton sous
 * un monogramme et vit seul sur sa page, celui-ci est répété trois fois dans une
 * colonne. Ce qu'ils partagent vraiment est déjà extrait dans `ui/FormMessage`
 * et `ui/SubmitButton`.
 *
 * Les champs ne franchissent pas la frontière client : ils traversent en
 * `children`, rendus par la page.
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
    /* `state` et non `state.tone` : chaque réponse du serveur est un nouvel
       objet, y compris à contenu identique. Deux enregistrements réussis
       d'affilée déclenchent donc bien l'effet deux fois. */
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
        /* Éteint pendant l'envoi : sur un changement de mot de passe, la seconde
           demande arrive avec un mot de passe actuel qui vient de changer — donc
           un refus affiché sur une opération qui a réussi. */
        disabled={isPending}
        wrapperClassName="flex"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
