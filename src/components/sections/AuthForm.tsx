"use client";

import { useActionState, useEffect, useState } from "react";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { AuthAction } from "@/types/auth";

interface AuthFormProps {
  /**
   * L'action serveur de la page. React ne transmet pas la fonction mais une
   * référence vers elle : le corps de l'action ne part jamais dans le bundle.
   */
  action: AuthAction;
  submitLabel: string;
  /** Les champs, rendus sur le serveur par la page et traversant ce composant. */
  children: React.ReactNode;
}

/**
 * Le `<form>` des trois pages de compte, et la seule partie cliente
 * d'`AuthPanel`.
 *
 * Il existe parce qu'afficher un refus du serveur demande un état : le garder
 * dans `AuthPanel` aurait rendu client le monogramme, les liens et toute la mise
 * en page pour une phrase. Les champs restent rendus par le serveur, ils
 * traversent en `children`.
 *
 * `useActionState` plutôt qu'un `useState` + `fetch` : il tient l'envoi, la
 * valeur renvoyée et l'état « en cours », et conserve le fonctionnement natif du
 * `<form>`.
 */
export function AuthForm({ action, submitLabel, children }: AuthFormProps) {
  /* `null` = rien n'a encore été envoyé. Voir `types/auth`. */
  const [state, formAction, isPending] = useActionState(action, null);

  /**
   * L'intention avec laquelle on est arrivé, relevée dans l'URL : d'où l'on
   * vient et quelle œuvre on voulait mettre de côté. Voir `safeReturnPath` dans
   * `lib/auth-actions.ts`.
   *
   * Des champs cachés et non une action enveloppée : glisser une fonction dans
   * `action={...}` serait plus court et casserait le formulaire sans JavaScript,
   * `action` n'étant plus la référence directe à l'action serveur. Ici, JS
   * coupé, les deux valeurs partent vides et le visiteur atterrit dans son
   * compte — la panne tombe du bon côté.
   *
   * Les valeurs sont posées après le montage : le serveur ne connaît pas l'URL
   * d'une page statique, et les lire avec `searchParams` aurait rendu
   * `/connexion` et `/inscription` dynamiques.
   */
  const [intent, setIntent] = useState({ retour: "", oeuvre: "" });

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setIntent({
      retour: search.get("retour") ?? "",
      oeuvre: search.get("oeuvre") ?? "",
    });
  }, []);

  return (
    <form action={formAction} className="mt-12 space-y-8">
      <input type="hidden" name="retour" value={intent.retour} readOnly />
      <input type="hidden" name="oeuvre" value={intent.oeuvre} readOnly />

      {children}

      {/* Sous les champs et au-dessus du bouton : le chemin du regard entre ce
          qu'on vient de taper et ce qu'on s'apprête à recliquer. Le rendu vit
          dans `ui/FormMessage` — ce qui se serait désynchronisé en le recopiant
          n'est pas le style mais le rôle ARIA, qui ne se voit sur aucune
          capture d'écran. */}
      <FormMessage state={state} surface="ink" className="text-center" />

      {/* Pas de bouton pleine largeur : `rounded-full` étiré sur 24rem donne deux
          demi-cercles de part et d'autre d'un texte perdu au milieu. `size="sm"`
          aligne sa hauteur sur celle des champs.

          `SubmitButton` et non `Button` : il lit la validité du formulaire
          lui-même, aucune règle n'est à redéclarer ici. */}
      <SubmitButton
        variant="inverse"
        size="sm"
        /* Éteint aussi pendant l'envoi : sans ça, deux clics rapides envoient
           deux inscriptions, et la seconde revient en « un compte existe déjà »
           — un message d'échec sur une inscription qui a marché. */
        disabled={isPending}
        wrapperClassName="mt-10 flex justify-center"
        /* Le `px-4` de la taille `sm` est dessiné pour un bouton secondaire ;
           ici c'est l'action principale de la page. */
        className="px-8"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
