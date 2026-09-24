"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

interface SignOutButtonProps {
  /**
   * Il vit à deux endroits qui ne se ressemblent pas : une entrée du menu de
   * compte, et le bas d'une page. Le composant garde ce qui ne change jamais et
   * laisse l'apparence à celui qui le pose.
   */
  className?: string;
  /** `menuitem` quand il est une entrée du menu de compte. */
  role?: string;
}

/** Où l'on atterrit en sortant : l'accueil, la seule page qui n'attend personne. */
const AFTER_SIGN_OUT = "/";

/**
 * Se déconnecter. La seule opération de compte qui ne passe pas par une Server
 * Action, à cause du cache : `useSession()` garde la session dans le navigateur
 * et une Server Action ne peut pas la lui faire oublier. Le Header continuerait
 * d'afficher « Mon compte » jusqu'au prochain rechargement complet. C'est ce
 * pour quoi la route `app/api/auth/[...all]` existe.
 *
 * Pas de transition de page, et c'est un choix : le panneau a été branché ici
 * puis retiré. Il annonce une salle où l'on entre ; se déconnecter, c'est fermer
 * la porte derrière soi. Ne pas le rebrancher sans raison neuve.
 *
 * La déconnexion a lieu avant le `push`, pas pendant : l'ordre inverse serait
 * plus vif mais un échec réseau nous aurait déjà emmenés sur l'accueil, où le
 * header afficherait encore « Mon compte ».
 *
 * Un `push` seul, sans `router.refresh()` : depuis Next 15, `staleTimes.dynamic`
 * vaut 0 et les pages dynamiques ne sont plus gardées côté client. Le refresh
 * est même nuisible — il déclenche la redirection de `requireUser()` en
 * concurrence avec le `push`.
 */
export function SignOutButton({ className, role }: SignOutButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function signOut() {
    /* Pas de remise à `false` après coup : on quitte la page, et « Se
       déconnecter » réapparaîtrait une fraction de seconde. */
    setIsPending(true);

    try {
      await authClient.signOut();
    } catch (error) {
      /* Réseau coupé, la session reste ouverte : on rend le bouton cliquable
         plutôt que de faire croire à une déconnexion qui n'a pas eu lieu. */
      console.error("[auth]", error);
      setIsPending(false);
      return;
    }

    router.push(AFTER_SIGN_OUT);
  }

  return (
    /* Ni `ui/Button` ni un lien : ce n'est pas l'action principale de la page,
       dans un musée où la page sert à regarder des œuvres. */
    <button
      type="button"
      role={role}
      onClick={signOut}
      disabled={isPending}
      className={cn(
        "text-sm transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40",
        /* Habillage par défaut, celui d'une page claire. Le menu du header, qui
           est sombre, le remplace entièrement. */
        "text-ink-mute underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink",
        className,
      )}
    >
      Se déconnecter
    </button>
  );
}
