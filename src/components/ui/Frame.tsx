import { cn } from "@/lib/cn";

interface FrameProps {
  children: React.ReactNode;
  /**
   * Fond SUR LEQUEL le cadre est posé, et non couleur du cadre : `paper` sur un
   * bloc clair, `ink` sur un bloc sombre. C'est au composant de choisir le trait
   * qui reste lisible — un appelant qui devrait écrire la couleur lui-même
   * finirait par écrire une valeur en dur.
   */
  tone?: "paper" | "ink";
  className?: string;
}

/**
 * Équerres de cadrage autour d'un contenu.
 *
 * C'est le motif du monogramme (voir <Logo />) sorti du logo et posé autour des
 * reproductions : le même repère de cadrage, à deux échelles. C'est ce qui donne
 * au site une signature graphique reconnaissable sans ajouter une seule couleur
 * — la contrainte du projet étant justement de laisser l'œuvre porter le design.
 *
 * ZÉRO logique métier : il ne sait pas qu'il encadre une œuvre. Il encadrerait
 * aussi bien une vidéo ou un plan d'accès, d'où sa place dans `ui/`.
 *
 * OÙ L'UTILISER — et c'est une règle de direction artistique, pas un détail de
 * mise en œuvre : LE CADRE MARQUE L'ŒUVRE QU'ON REGARDE, JAMAIS CELLES QU'ON
 * PARCOURT.
 *
 * - OUI : la reproduction d'un Hero, celle d'une fiche, l'œuvre affichée dans la
 *   sélection de l'accueil, le détail en bande du bloc éditorial. À chaque fois,
 *   une image unique, montrée pour elle-même.
 * - NON : les cartes de /collection, les vignettes secondaires d'une fiche, les
 *   cartes de la spirale. Trois raisons, dans l'ordre : répété trente-neuf fois,
 *   le motif cesse d'être une signature et devient du papier peint ; les
 *   équerres débordent du cadre de 0.75rem et viendraient se cogner dans les
 *   gouttières de la grille ; et une grille sert à COMPARER des œuvres, pas à en
 *   contempler une — l'y encadrer ne veut rien dire.
 *
 * C'est ce contraste qui donne sa valeur au motif : en le voyant apparaître, on
 * sait qu'on est passé du parcours à l'œuvre.
 *
 * Les équerres sont posées À L'EXTÉRIEUR du contenu (`-inset-3`) et non dessus :
 * un repère de cadrage se trace autour de l'image, pas par-dessus. Prévoir
 * 0.75rem de dégagement autour du bloc — sur un contenu collé à la marge du
 * site, les équerres déborderaient.
 */
export function Frame({ children, tone = "paper", className }: FrameProps) {
  /* `text-*` puis `border-current` sur chaque équerre : la couleur est écrite
     une fois, pas quatre. */
  const corner = "absolute size-6 border-current";

  return (
    <div
      className={cn(
        "relative",
        tone === "ink" ? "text-paper/40" : "text-ink/25",
        className,
      )}
    >
      {children}

      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-3"
      >
        <span className={cn(corner, "top-0 left-0 border-t border-l")} />
        <span className={cn(corner, "top-0 right-0 border-t border-r")} />
        <span className={cn(corner, "bottom-0 left-0 border-b border-l")} />
        <span className={cn(corner, "right-0 bottom-0 border-r border-b")} />
      </span>
    </div>
  );
}
