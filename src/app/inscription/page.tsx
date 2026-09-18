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
 * TROIS CHAMPS, ET C'EST UN RECUL ASSUMÉ. La page en portait deux, sur un
 * principe qui tient toujours : chaque champ ajouté est un visiteur perdu, et
 * le musée n'a besoin d'un nom que sur un billet — donc au moment d'acheter,
 * pas à l'ouverture du compte.
 *
 * Better Auth en a décidé autrement : sa table `user` porte une colonne `name`
 * NON NULLE, et son inscription par e-mail exige le champ. Restaient trois
 * sorties. La remplir d'une chaîne vide : une colonne qui ment, et un « Bonjour »
 * suivi de rien le jour où l'on affichera le nom. La déduire de l'adresse
 * (`chloe.b@…` → « chloe.b ») : on garde deux champs, mais on invente une
 * identité que personne n'a choisie et qu'on finira par afficher telle quelle.
 * Ou demander le nom. C'est la troisième qui a été retenue : un champ de plus
 * coûte quelques secondes, une donnée fabriquée se paie bien plus tard.
 *
 * Il est en tête du formulaire, avant l'adresse : c'est l'ordre dans lequel on
 * se présente.
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
           seul indice d'autofill — celui du nom complet. Découper en deux
           champs pour satisfaire l'autofill reviendrait à ajouter le champ
           qu'on vient justement d'éviter. */
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
        /* `new-password` : le gestionnaire de mots de passe propose alors d'en
           générer un, au lieu de remplir avec un mot de passe déjà connu. */
        autoComplete="new-password"
        placeholder="8 caractères minimum"
        required
      />
    </AuthPanel>
  );
}
