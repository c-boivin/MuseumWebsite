import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge, informé des tailles de texte maison.
 *
 * Il connaît les classes de Tailwind mais pas les nôtres. Pour lui, `text-title`
 * est une classe inconnue commençant par `text-`, donc probablement une COULEUR :
 * mise face à `text-paper`, il en déduisait un conflit et supprimait la taille.
 * Le titre perdait silencieusement ses 2.75rem.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "title", "lead"] }],
    },
  },
});

/**
 * Fusionne des classes Tailwind en résolvant les conflits : sans elle,
 * `"px-4" + "px-8"` laisse l'ordre du CSS généré trancher, donc un résultat
 * imprévisible. C'est ce qui permet à un composant ui/ d'avoir un style par
 * défaut qu'un parent peut surcharger.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
