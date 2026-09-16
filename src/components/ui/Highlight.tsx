import { Fragment } from "react";
import { cn } from "@/lib/cn";
import { splitOnMatch } from "@/lib/search";

interface HighlightProps {
  /** Texte affiché, dans sa forme d'origine — accents et majuscules compris. */
  text: string;
  /** Ce que l'utilisateur a tapé. Vide = texte rendu tel quel. */
  query: string;
  /** Classes du surlignage, pas du texte entier. */
  className?: string;
}

/**
 * Affiche un texte en surlignant ce qui correspond à une requête.
 *
 * Aucune connaissance du métier : il ne sait pas qu'il s'agit d'une œuvre ou d'un
 * artiste, seulement d'un texte et d'une saisie. Il resservira tel quel le jour
 * où la billetterie aura sa propre recherche.
 *
 * `<mark>` et non `<span>` : l'élément a un sens — « passage pertinent pour ce
 * que l'utilisateur vient de faire » — et les lecteurs d'écran l'annoncent. Un
 * span coloré ne dirait rien à qui n'a pas la couleur.
 */
export function Highlight({ text, query, className }: HighlightProps) {
  const chunks = splitOnMatch(text, query);

  return (
    <>
      {chunks.map((chunk) =>
        chunk.match ? (
          <mark
            key={chunk.start}
            /* `text-inherit` : `<mark>` force sa propre couleur de texte dans le
               navigateur. Sans ça, le nom d'artiste passerait du gris au noir sur
               les seules lettres surlignées. */
            className={cn("bg-accent/20 text-inherit", className)}
          >
            {chunk.text}
          </mark>
        ) : (
          <Fragment key={chunk.start}>{chunk.text}</Fragment>
        ),
      )}
    </>
  );
}
