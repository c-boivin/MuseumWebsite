import { cn } from "@/lib/cn";
import type { AuthFormState } from "@/types/auth";

interface FormMessageProps {
  /** `null` = le formulaire n'a pas encore été envoyé : rien n'est rendu. */
  state: AuthFormState;
  /**
   * Fond sur lequel le message est posé. Ce n'est pas qu'une couleur de texte :
   * le rouge d'erreur change de valeur — `danger` est éclairci pour tenir sur du
   * noir, `danger-deep` assombri pour tenir sur du papier.
   */
  surface?: "paper" | "ink";
  className?: string;
}

/**
 * Le retour d'un formulaire : refus, confirmation, ou information.
 *
 * Extrait d'`AuthForm` le jour où les paramètres du compte en ont eu besoin. La
 * duplication aurait été pire qu'un doublon de style : c'est le rôle ARIA qui se
 * serait désynchronisé, et un rôle ARIA oublié ne se voit sur aucune capture.
 *
 * Le rôle suit le ton : `alert` interrompt le lecteur d'écran, `status` attend
 * qu'il ait fini sa phrase. Un refus doit couper la parole, le visiteur est en
 * train de repartir vers le bouton. Une confirmation, non.
 *
 * Aucune couleur pour le succès : le site n'a pas de vert et n'en aura pas pour
 * trois messages. C'est le rouge qui a besoin d'être vu avant d'être lu, parce
 * qu'il annonce que rien ne s'est passé.
 *
 * Server Component : c'est le formulaire au-dessus qui détient l'état.
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
