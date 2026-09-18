"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

interface SignOutButtonProps {
  /**
   * Habillage du bouton par son parent.
   *
   * Il vit à deux endroits qui ne se ressemblent pas : une entrée du menu de
   * compte du header, et le bas d'une page. Le composant garde donc pour lui ce
   * qui ne change jamais — ce qu'il fait, et l'état pendant l'envoi — et laisse
   * l'apparence à celui qui le pose.
   */
  className?: string;
  /** `menuitem` quand il est une entrée du menu de compte. */
  role?: string;
}

/**
 * Se déconnecter.
 *
 * ── LA SEULE OPÉRATION DE COMPTE QUI NE PASSE PAS PAR UNE SERVER ACTION ──
 * Tout le reste — inscription, connexion, modification, suppression — se fait
 * sur le serveur, pour que rien de sensible ne traverse le JavaScript de page.
 * La déconnexion, elle, doit passer par le client, et la raison est le CACHE :
 * `useSession()` garde la session dans le navigateur, et une Server Action ne
 * peut pas le lui faire oublier. La session serait bien supprimée en base, mais
 * le Header continuerait d'afficher « Mon compte » jusqu'au prochain
 * rechargement complet — déconnecté côté serveur, connecté à l'écran.
 * C'est précisément ce pour quoi la route `app/api/auth/[...all]` existe.
 *
 * ── PAS DE TRANSITION DE PAGE, ET C'EST UN CHOIX, PAS UN OUBLI ──
 * Le panneau noir a été branché ici puis RETIRÉ, après l'avoir vu à l'usage.
 * Techniquement rien ne l'empêche — `motion/TransitionLink` ne fait que déclarer
 * une intention dans le store, et `leave()` s'appelle depuis n'importe où. Mais
 * ce panneau annonce une SALLE où l'on entre ; se déconnecter n'est pas entrer
 * quelque part, c'est fermer la porte derrière soi. Le retour à l'accueil doit
 * être immédiat.
 *
 * Ne pas le rebrancher sans une raison neuve : l'absence de transition ici est
 * délibérée, et elle a déjà été essayée dans l'autre sens.
 *
 * ── LA DÉCONNEXION A LIEU AVANT, PAS PENDANT ──
 * On attend la réponse du serveur, PUIS on lance le panneau. L'ordre inverse
 * serait plus vif à l'œil, et faux : un échec réseau nous aurait déjà emmenés sur
 * l'accueil, où le header continuerait d'afficher « Mon compte » — le visiteur
 * croirait être sorti sans l'être. En attendant, un refus laisse le bouton
 * cliquable et la page en place, ce qui est la seule chose honnête à montrer.
 *
 * ── UN `push` SEUL, SANS `router.refresh()` ──
 * Le `refresh` servait à vider le cache client du routeur, pour qu'un retour en
 * arrière ne réaffiche pas la collection d'une session fermée. Il ne protège plus
 * de rien : depuis Next 15, `staleTimes.dynamic` vaut 0 par défaut et les pages
 * dynamiques — tout `/compte` l'est — ne sont plus gardées côté client. Il est
 * même nuisible ici : rafraîchir une page gardée par `requireUser()` alors qu'on
 * vient de fermer la session y déclenche une redirection vers `/connexion`, en
 * concurrence avec le `push` vers l'accueil. Vérifié dans
 * `node_modules/next/dist/docs/…/staleTimes.md`.
 */
/** Où l'on atterrit en sortant : l'accueil, la seule page qui n'attend personne. */
const AFTER_SIGN_OUT = "/";

export function SignOutButton({ className, role }: SignOutButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function signOut() {
    /* Pas de remise à `false` après coup : on quitte la page, et remettre un
       état sur un composant en train d'être démonté ne sert qu'à faire
       réapparaître « Se déconnecter » une fraction de seconde. */
    setIsPending(true);

    try {
      await authClient.signOut();
    } catch (error) {
      /* Réseau coupé : la session reste ouverte. On le dit en rendant le bouton
         de nouveau cliquable plutôt qu'en renvoyant sur l'accueil, ce qui
         ferait croire à une déconnexion qui n'a pas eu lieu. */
      console.error("[auth]", error);
      setIsPending(false);
      return;
    }

    router.push(AFTER_SIGN_OUT);
  }

  return (
    /* Ni `ui/Button` ni un lien : ce n'est pas l'action principale de la page —
       ce le serait sur un bandeau de compte classique, pas dans un musée où la
       page sert à regarder des œuvres. Même ton discret que le lien « Retour à
       la collection » de la fiche. */
    <button
      type="button"
      role={role}
      onClick={signOut}
      disabled={isPending}
      className={cn(
        "text-sm transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40",
        /* Habillage par défaut : celui d'une page claire, le ton discret du lien
           « Retour à la collection » de la fiche œuvre. Le menu du header, qui
           est sombre, le remplace entièrement. */
        "text-ink-mute underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink",
        className,
      )}
    >
      Se déconnecter
    </button>
  );
}
