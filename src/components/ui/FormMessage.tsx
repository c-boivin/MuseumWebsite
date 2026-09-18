import { cn } from "@/lib/cn";
import type { AuthFormState } from "@/types/auth";

interface FormMessageProps {
  /** `null` = le formulaire n'a pas encore été envoyé : rien n'est rendu. */
  state: AuthFormState;
  /**
   * Fond SUR LEQUEL le message est posé — même vocabulaire que `Section`,
   * `NavLinks` et `Field`.
   *
   * Ce n'est pas qu'une couleur de texte : le rouge d'erreur change carrément de
   * valeur. `danger` est éclairci pour tenir sur du noir, `danger-deep` assombri
   * pour tenir sur du papier — voir les deux tokens dans `globals.css`, et la
   * raison pour laquelle il n'y en a pas un seul.
   */
  surface?: "paper" | "ink";
  className?: string;
}

/**
 * Le retour d'un formulaire : refus, confirmation, ou information.
 *
 * ── EXTRAIT D'`AuthForm` LE JOUR OÙ LES PARAMÈTRES DU COMPTE EN ONT EU BESOIN ──
 * Règle du projet appliquée : dès qu'un bout de balisage sert à deux endroits,
 * il devient un composant. Ici la duplication aurait été pire qu'un doublon de
 * style, parce que c'est le RÔLE ARIA qui se serait désynchronisé — et un rôle
 * ARIA oublié ne se voit sur aucune capture d'écran.
 *
 * ── LE RÔLE SUIT LE TON, ET C'EST LE CŒUR DU COMPOSANT ──
 * `alert` interrompt le lecteur d'écran pour annoncer le message tout de suite,
 * `status` attend qu'il ait fini sa phrase. Un refus doit couper la parole : le
 * visiteur est en train de repartir vers le bouton. Une confirmation, non.
 *
 * ── AUCUNE COULEUR POUR LE SUCCÈS ──
 * Le site n'a pas de vert, et il n'en aura pas pour trois messages : une
 * confirmation se lit dans son texte, pas dans sa teinte. C'est le rouge qui a
 * besoin d'être vu avant d'être lu, parce qu'il annonce que rien ne s'est
 * passé. Ajouter un vert ferait entrer une couleur dans une palette qui n'en a
 * que pour les œuvres.
 *
 * Server Component : il n'affiche qu'un texte. C'est le formulaire au-dessus qui
 * détient l'état.
 */
export function FormMessage({
  state,
  surface = "paper",
  className,
}: FormMessageProps) {
  if (!state) return null;

  const colors = {
    paper: { error: "text-danger-deep", calm: "text-ink-soft" },
    ink: { error: "text-danger", calm: "text-paper/60" },
  }[surface];

  return (
    <p
      role={state.tone === "error" ? "alert" : "status"}
      className={cn(
        "text-balance text-sm leading-relaxed",
        state.tone === "error" ? colors.error : colors.calm,
        className,
      )}
    >
      {state.message}
    </p>
  );
}
