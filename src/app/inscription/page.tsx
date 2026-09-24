import type { Metadata } from "next";
import { AuthPanel } from "@/components/sections/AuthPanel";
import { Field } from "@/components/ui/Field";
import { signUpAction } from "@/lib/auth-actions";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Créez votre compte pour conserver vos billets et votre sélection d'œuvres.",
  robots: { index: false, follow: true },
};

/**
 * Page Inscription.
 *
 * Trois champs, et c'est un recul assumé : la page en portait deux, sur un
 * principe qui tient toujours — chaque champ ajouté est un visiteur perdu.
 *
 * Better Auth en a décidé autrement, sa table `user` portant une colonne `name`
 * non nulle. Restaient trois sorties : la remplir d'une chaîne vide, soit une
 * colonne qui ment ; la déduire de l'adresse, soit inventer une identité que
 * personne n'a choisie et qu'on finira par afficher ; ou demander le nom. Un
 * champ de plus coûte quelques secondes, une donnée fabriquée se paie bien plus
 * tard.
 *
 * Il est en tête du formulaire : c'est l'ordre dans lequel on se présente.
 */
export default function SignupPage() {
  return (
    <AuthPanel
      title="Créer un compte"
      submitLabel="Créer mon compte"
      action={signUpAction}
      links={[{ label: "J'ai déjà un compte", href: "/connexion" }]}
    >
      <Field
        tone="ink"
        label="Nom"
        name="name"
        /* `name` et non `given-name` + `family-name` : un seul champ, donc un
           seul indice d'autofill. Le découper pour satisfaire l'autofill
           reviendrait à ajouter le champ qu'on vient d'éviter. */
        autoComplete="name"
        placeholder="Camille Durand"
        required
      />

      <Field
        tone="ink"
        label="Adresse e-mail"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="vous@exemple.fr"
        required
      />

      <Field
        tone="ink"
        label="Mot de passe"
        name="password"
        type="password"
        /* `new-password` : le gestionnaire propose d'en générer un, au lieu de
           remplir avec un mot de passe déjà connu. */
        autoComplete="new-password"
        placeholder="8 caractères minimum"
        required
      />
    </AuthPanel>
  );
}
