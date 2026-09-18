"use client";

import { useActionState, useEffect, useState } from "react";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { AuthAction } from "@/types/auth";

interface AuthFormProps {
  /**
   * L'action serveur de la page : connexion, inscription, mot de passe oublié.
   *
   * ELLE ARRIVE EN PROP DEPUIS UN SERVER COMPONENT, ce qui a l'air impossible
   * — on passe une fonction du serveur à du code du navigateur. React ne
   * transmet pas la fonction : il transmet une RÉFÉRENCE vers elle, et le
   * formulaire envoyé déclenche un appel au serveur. Le corps de l'action ne
   * part jamais dans le bundle.
   */
  action: AuthAction;
  submitLabel: string;
  /** Les champs, rendus sur le serveur par la page et traversant ce composant. */
  children: React.ReactNode;
}

/**
 * Le `<form>` des trois pages de compte, et la SEULE partie cliente d'`AuthPanel`.
 *
 * POURQUOI IL EXISTE. Le formulaire était écrit directement dans `AuthPanel`,
 * qui est un Server Component, et c'était bien tant que l'action ne répondait
 * rien. Dès lors qu'un refus doit s'afficher — « mot de passe incorrect » — il
 * faut un état, donc du client. Le mettre sur `AuthPanel` aurait rendu client
 * le monogramme, les liens et toute la mise en page pour une phrase.
 *
 * LES CHAMPS RESTENT RENDUS PAR LE SERVEUR : ils traversent ce composant en
 * `children`, ils ne sont pas construits par lui. La frontière client est donc
 * la plus étroite possible — le bouton, le message, et rien d'autre.
 *
 * `useActionState` plutôt qu'un `useState` + `fetch` : il tient à lui seul
 * l'envoi, la valeur renvoyée et l'état « en cours », et il conserve le
 * fonctionnement natif du `<form>`.
 */
export function AuthForm({ action, submitLabel, children }: AuthFormProps) {
  /* `null` = rien n'a encore été envoyé. Voir `types/auth`. */
  const [state, formAction, isPending] = useActionState(action, null);

  /**
   * L'INTENTION AVEC LAQUELLE ON EST ARRIVÉ ICI, relevée dans l'URL.
   *
   * Un visiteur déconnecté qui clique sur le signet d'une œuvre est envoyé vers
   * la connexion avec deux paramètres : d'où il vient, et quelle œuvre il
   * voulait mettre de côté. Sans eux, il ressortait dans « Ma collection » — ni
   * la page qu'il regardait, ni l'œuvre qu'il visait. Voir `safeReturnPath` dans
   * `lib/auth-actions.ts`, qui les reçoit et les vérifie.
   *
   * ── DES CHAMPS CACHÉS, ET NON UNE ACTION ENVELOPPÉE ──
   * On pourrait lire l'URL au moment de l'envoi, en glissant une fonction dans
   * `action={...}`. Ce serait plus court et ça casserait le formulaire sans
   * JavaScript : `action` ne serait plus la référence directe à l'action
   * serveur, et le navigateur n'aurait plus rien à poster tout seul. Avec des
   * champs cachés, JS coupé, les deux valeurs partent vides — le visiteur se
   * connecte et atterrit dans son compte, ce qui est exactement le comportement
   * d'avant. La panne tombe du bon côté.
   *
   * ── LES VALEURS SONT POSÉES APRÈS LE MONTAGE ──
   * Le serveur ne connaît pas l'URL d'une page statique : il rend donc deux
   * champs vides, et le navigateur les remplit. C'est aussi ce qui garde
   * `/connexion` et `/inscription` PRÉ-GÉNÉRÉES — les lire côté serveur avec
   * `searchParams` les aurait rendues dynamiques.
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

      {/* SOUS LES CHAMPS ET AU-DESSUS DU BOUTON : c'est le chemin du regard
          entre ce qu'on vient de taper et ce qu'on s'apprête à recliquer.

          Le rendu lui-même est parti dans `ui/FormMessage` le jour où les
          formulaires de `/compte/profil` ont eu besoin du même message sur
          fond clair. Ce qui se serait désynchronisé en le recopiant n'est pas le
          style, c'est le RÔLE ARIA — et un rôle ARIA oublié ne se voit sur
          aucune capture d'écran. */}
      <FormMessage state={state} surface="ink" className="text-center" />

      {/* PAS DE BOUTON PLEINE LARGEUR, et c'est une question de forme autant
          que de poids : `rounded-full` étiré sur 24rem transforme les deux
          extrémités en demi-cercles de 1.5rem de rayon, deux grosses bulles de
          part et d'autre d'un texte perdu au milieu. À la taille de son
          libellé, la même capsule redevient une pastille.

          `size="sm"` aligne aussi sa hauteur sur celle des champs — le
          formulaire n'a plus qu'un seul gabarit vertical.

          `SubmitButton` et non `Button` : il reste éteint tant que les champs
          obligatoires ne sont pas remplis. Il lit la validité du formulaire
          lui-même, aucune règle n'est à redéclarer ici. */}
      <SubmitButton
        variant="inverse"
        size="sm"
        /* ÉTEINT AUSSI PENDANT L'ENVOI, et la raison se voit à l'écran : sans
           ça, deux clics rapides sur « Créer mon compte » envoient deux
           inscriptions. La première réussit, la seconde revient en « un compte
           existe déjà avec cette adresse » — un message d'échec sur une
           inscription qui a pourtant marché, c'est-à-dire le pire retour
           possible. */
        disabled={isPending}
        wrapperClassName="mt-10 flex justify-center"
        /* Le `px-4` de la taille `sm` est dessiné pour un bouton secondaire ;
           ici c'est l'action principale de la page, elle a besoin de plus de
           marge autour de son texte. */
        className="px-8"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
