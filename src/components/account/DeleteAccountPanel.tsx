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
 * ── POURQUOI LE FORMULAIRE EST CACHÉ DERRIÈRE UN BOUTON ──
 * Le champ de mot de passe et le bouton rouge ne s'affichent qu'après une
 * première demande explicite. Ce n'est pas de la pudeur de mise en page : un
 * champ « mot de passe » posé en permanence au bas des paramètres est un champ
 * qu'un gestionnaire de mots de passe peut remplir tout seul — il ne resterait
 * alors qu'un clic entre le visiteur et la perte de son compte. Le replier
 * remet une intention entre les deux.
 *
 * ── ET POURQUOI PAS UNE FENÊTRE DE CONFIRMATION ──
 * Une modale serait le réflexe. Elle flotterait au-dessus du contenu, ce que ce
 * site ne fait nulle part, et il faudrait la rendre fermable à l'échappement,
 * piéger le focus à l'intérieur, la rendre au clavier. Le dépliage sur place
 * donne la même marche à franchir sans rien de tout cela — et le mot de passe
 * demandé est une confirmation autrement plus solide qu'un « Êtes-vous sûr ? ».
 *
 * ── LE RECHARGEMENT COMPLET N'EST PAS UNE PARESSE ──
 * Après la suppression, le compte n'existe plus et le cookie est retiré, mais le
 * cache de session du navigateur, lui, ignore tout : `router.push("/")` ramènerait
 * sur l'accueil avec « Mon compte » encore affiché dans le Header. Seul un
 * rechargement du document jette l'ensemble de l'état client — session, cache
 * des favoris, panier. C'est exactement ce qu'on veut d'un compte supprimé : il
 * ne doit rien rester.
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
            /* `current-password` : c'est bien le mot de passe existant qu'on
               demande. Un `new-password` ferait proposer au gestionnaire d'en
               générer un nouveau, sur un formulaire de suppression. */
            autoComplete="current-password"
            required
          />
        </AccountForm>
      ) : (
        /* `danger-outline` et non `danger` : ce bouton n'efface encore rien, il
           ouvre une question. Il reste donc neutre au repos et ne vire au rouge
           qu'au survol — au moment où la main s'y pose, avant le clic. Le rouge
           PLEIN est réservé à celui qui exécute : voir les deux variants dans
           `ui/Button`. */
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
