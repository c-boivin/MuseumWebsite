import type { Metadata } from "next";
import { AuthPanel } from "@/components/sections/AuthPanel";
import { Field } from "@/components/ui/Field";
import { signInAction } from "@/lib/auth-actions";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous à votre compte pour retrouver vos billets et votre sélection d'œuvres.",
  /* Une page de compte n'a rien à faire dans un moteur de recherche : elle
     n'apporte aucun contenu, et une recherche sur le nom du musée ne doit pas
     proposer d'entrer un mot de passe en premier résultat. Même raisonnement
     sur les deux autres pages du parcours. */
  robots: { index: false, follow: true },
};

/**
 * Page Connexion.
 *
 * Aucune donnée, aucun appel : Next la pré-rend au build. La mise en page vit
 * dans `sections/AuthPanel`, partagée avec l'inscription et le mot de passe
 * oublié — `app/` ne fait que du routage et fournit les champs.
 */
export default function LoginPage() {
  return (
    <AuthPanel
      title="Connexion"
      submitLabel="Se connecter"
      action={signInAction}
      links={[
        { label: "Mot de passe oublié ?", href: "/mot-de-passe-oublie" },
        { label: "Créer un compte", href: "/inscription" },
      ]}
    >
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
        /* `current-password` et non `new-password` : c'est ce qui dit au
           gestionnaire de mots de passe de PROPOSER un mot de passe existant
           plutôt que d'en suggérer un nouveau. */
        autoComplete="current-password"
        required
      />
    </AuthPanel>
  );
}
