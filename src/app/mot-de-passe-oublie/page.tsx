import type { Metadata } from "next";
import { AuthPanel } from "@/components/sections/AuthPanel";
import { Field } from "@/components/ui/Field";
import { requestPasswordResetAction } from "@/lib/auth-actions";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description:
    "Recevez un lien de réinitialisation pour retrouver l'accès à votre compte.",
  robots: { index: false, follow: true },
};

/**
 * Page Mot de passe oublié.
 *
 * SEULE DES TROIS PAGES À PORTER UN TEXTE D'EXPLICATION. Un champ « adresse
 * e-mail » surmonté d'un bouton « Envoyer le lien » ne dit pas ce qui va se
 * passer ensuite — or ici l'action se termine ailleurs, dans une boîte mail. Les
 * deux autres pages n'en ont pas besoin : leurs champs se suffisent.
 *
 * ET SEULE DES TROIS À NE RIEN FAIRE. L'envoi d'un lien suppose un service
 * d'e-mails, hors périmètre du projet : l'action répond donc que la
 * réinitialisation n'est pas en service, plutôt que d'annoncer un e-mail qui
 * n'arrivera jamais. Le formulaire reste debout, dessiné et accessible — c'est
 * la position déjà tenue par le bouton « Payer » de la billetterie. Détail dans
 * `lib/auth-actions`.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthPanel
      title="Mot de passe oublié"
      /* LE CHAPEAU NE PROMET PLUS L'E-MAIL. Il annonçait « nous vous enverrons
         un lien » — une phrase devenue fausse, et fausse de la pire façon : le
         visiteur part attendre dans sa boîte mail un message qui n'existe pas,
         et rien ne le détrompera jamais. Il dit donc la limite AVANT la saisie,
         comme la billetterie annonce que le paiement est hors service avant
         qu'on clique, et non après. */
      lead="Indiquez l'adresse de votre compte pour demander un nouveau mot de passe. L'envoi du lien par e-mail n'est pas encore en service sur ce site."
      submitLabel="Envoyer le lien"
      action={requestPasswordResetAction}
      links={[{ label: "Retour à la connexion", href: "/connexion" }]}
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
    </AuthPanel>
  );
}
