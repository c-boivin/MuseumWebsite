import { cn } from "@/lib/cn";

interface CartIconProps {
  className?: string;
}

/**
 * Icône de panier : un cabas, tracé au trait.
 *
 * Dessinée à la main plutôt qu'importée d'une bibliothèque d'icônes, pour la
 * même raison que le monogramme de `Logo` : une seule icône ne justifie pas une
 * dépendance, et le trait doit s'accorder aux équerres de cadrage du site —
 * même épaisseur, mêmes angles nets.
 *
 * `currentColor` et aucune taille en dur : c'est l'appelant qui décide de la
 * couleur (par `text-*`) et de la taille (par `size-*`), donc la même icône sert
 * au compteur du header, à 1rem sur fond noir, et au panier vide, à 2rem sur
 * fond sombre. `aria-hidden` : elle est toujours accompagnée d'un texte, et une
 * icône annoncée deux fois est du bruit pour un lecteur d'écran.
 */
export function CartIcon({ className }: CartIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      className={cn("size-5", className)}
    >
      {/* Le cabas : un trapèze à peine évasé, plus musée que supermarché. */}
      <path d="M4.5 7.5h15l-1.1 12.2a1.5 1.5 0 0 1-1.5 1.3H7.1a1.5 1.5 0 0 1-1.5-1.3L4.5 7.5Z" />
      {/* L'anse, ouverte vers le haut. */}
      <path d="M8.75 10V6.5a3.25 3.25 0 0 1 6.5 0V10" />
    </svg>
  );
}
