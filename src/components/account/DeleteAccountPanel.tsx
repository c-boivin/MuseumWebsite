"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { deleteAccountAction } from "@/lib/account-actions";
import { cn } from "@/lib/cn";
import { AccountForm } from "./AccountForm";

/**
 * La suppression du compte, en deux temps.
 *
 * Le formulaire est caché derrière un bouton, et ce n'est pas de la pudeur de
 * mise en page : un champ « mot de passe » posé en permanence au bas des
 * paramètres est un champ qu'un gestionnaire peut remplir tout seul — il ne
 * resterait qu'un clic entre le visiteur et la perte de son compte.
 *
 * Pas de modale : elle flotterait au-dessus du contenu, ce que ce site ne fait
 * nulle part, et il faudrait la rendre fermable à l'échappement, piéger le focus,
 * la rendre au clavier. Le dépliage sur place donne la même marche à franchir, et
 * le mot de passe demandé est une confirmation plus solide qu'un « Êtes-vous
 * sûr ? ».
 *
 * Le rechargement complet n'est pas une paresse : après la suppression, le cache
 * de session du navigateur ignore tout, et `router.push("/")` ramènerait sur
 * l'accueil avec « Mon compte » encore affiché. Seul un rechargement du document
 * jette l'ensemble de l'état client — session, favoris, panier.
 */
interface DeleteAccountPanelProps {
  /** Position du bloc dans la page, décidée par celle-ci. */
  className?: string;
}

export function DeleteAccountPanel({ className }: DeleteAccountPanelProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <section className={cn("border-line border-t pt-10", className)}>
      <Heading as="h2" size="heading">
        Supprimer mon compte
      </Heading>

      <p className="mt-4 max-w-reading text-ink-soft leading-relaxed">
        La suppression est définitive. Votre compte et les œuvres que vous avez
        mises de côté sont effacés, et cette action ne peut pas être annulée.
        Vos billets déjà achetés, eux, restent valables.
      </p>

      {isConfirming ? (
        <AccountForm
          action={deleteAccountAction}
          submitLabel="Supprimer définitivement mon compte"
          variant="danger"
          onSuccess={() => {
            /* `assign` et non `router.push` : voir l'en-tête du composant. */
            window.location.assign("/");
          }}
        >
          <Field
            label="Votre mot de passe"
            name="password"
            type="password"
            /* `current-password` : un `new-password` ferait proposer au
               gestionnaire d'en générer un nouveau, sur un formulaire de
               suppression. */
            autoComplete="current-password"
            required
          />
        </AccountForm>
      ) : (
        /* `danger-outline` et non `danger` : ce bouton n'efface encore rien, il
           ouvre une question. Le rouge plein est réservé à celui qui exécute. */
        <Button
          variant="danger-outline"
          size="sm"
          onClick={() => setIsConfirming(true)}
          className="mt-8"
        >
          Supprimer mon compte
        </Button>
      )}
    </section>
  );
}
