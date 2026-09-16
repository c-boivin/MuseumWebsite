import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge, informé des tailles de texte maison.
 *
 * Il connaît les classes de Tailwind par cœur, mais pas les nôtres. Or
 * `globals.css` définit `--text-display`, `--text-title` et `--text-lead` : pour
 * lui, `text-title` est une classe inconnue commençant par `text-`, donc
 * probablement une COULEUR. Mise face à `text-paper`, il en déduisait un conflit
 * et supprimait la taille :
 *
 *     cn("font-display text-title", "text-paper") -> "font-display text-paper"
 *
 * Le titre perdait silencieusement ses 2.75rem et retombait à la taille du texte
 * courant. Le piège vaut pour tout composant qui reçoit une couleur de texte par
 * `className` — d'où la correction ici plutôt qu'au cas par cas.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "title", "lead"] }],
    },
  },
});

/**
 * Fusionne des classes Tailwind en résolvant les conflits.
 *
 * Sans elle, `className="px-4" + className="px-8"` produit `"px-4 px-8"` et c'est
 * l'ordre du CSS généré qui tranche — donc un résultat imprévisible.
 * `cn()` garde la dernière classe gagnante : ici `px-8`.
 *
 * C'est ce qui permet à un composant ui/ d'avoir un style par défaut qu'un parent
 * peut surcharger via sa prop `className`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
