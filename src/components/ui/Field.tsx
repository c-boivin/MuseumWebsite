"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AUTOFILL_ANIMATION, hasContent } from "@/lib/autofill";
import { cn } from "@/lib/cn";

interface FieldProps {
  label: string;
  /** Nom du champ dans le formulaire, et identifiant de l'autofill navigateur. */
  name: string;
  type?: "text" | "email" | "password" | "tel";
  /**
   * Indice d'autofill (`email`, `current-password`…) : sans lui, un gestionnaire
   * de mots de passe ne reconnaît pas le champ.
   */
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  /**
   * Valeur de départ, pour un formulaire qui modifie plutôt qu'il ne crée.
   *
   * `defaultValue` et non `value` : le champ reste non contrôlé. Un `value`
   * obligerait à remonter chaque frappe dans un état, donc à rendre client tous
   * les formulaires qui utilisent ce champ.
   */
  defaultValue?: string;
  /**
   * Vérifiée par le navigateur, elle double la règle du serveur sans la
   * remplacer. Son intérêt est d'agir avant l'envoi : `SubmitButton` lit
   * `checkValidity()`, le bouton reste donc éteint.
   */
  minLength?: number;
  /**
   * Fond sur lequel le champ est posé, même vocabulaire que `Section`. C'est le
   * contraste entre le filet, le texte et l'invite qui s'inverse, pas seulement
   * la couleur du texte.
   */
  tone?: "paper" | "ink";
  className?: string;
}

const tones = {
  paper: {
    label: "text-ink-mute",
    input: "border-line text-ink placeholder:text-ink-mute focus:border-ink",
    button: "text-ink-mute hover:text-ink",
  },
  ink: {
    label: "text-paper/50",
    input:
      "border-paper/25 text-paper placeholder:text-paper/30 focus:border-paper",
    button: "text-paper/50 hover:text-paper",
  },
} as const;

/**
 * Champ de formulaire : un libellé, une saisie, et ses commandes.
 *
 * Un filet sous le texte et non une boîte : trois capsules empilées pèsent plus
 * lourd que tout le reste de la page, sur un site à fond clair dont la signature
 * est le trait fin. Le bouton garde sa capsule pleine, il reste le seul aplat du
 * formulaire donc le seul point d'arrivée de l'œil.
 *
 * Client Component, et c'est ce que coûtent les deux commandes : il faut savoir
 * si le champ est vide et si le mot de passe est révélé.
 */
export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  required,
  defaultValue,
  minLength,
  tone = "paper",
  className,
}: FieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  /* Part vrai quand le champ est prérempli plutôt que d'attendre l'effet de
     montage : serveur et navigateur calculent la même chose depuis
     `defaultValue`, donc aucun écart d'hydratation et pas de croix qui clignote. */
  const [hasValue, setHasValue] = useState(Boolean(defaultValue));
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === "password";

  /**
   * L'autofill ne déclenche aucun `onChange`, et sur un formulaire de connexion
   * Chrome n'expose même pas les valeurs au JavaScript tant que la page n'a reçu
   * aucun geste : le champ est visiblement plein et `input.value` vaut `""`.
   *
   * Deux cas, et il faut les deux parades :
   *
   * 1. remplissage avant ce montage — l'événement est passé mais la valeur est
   *    là, on la relit ;
   * 2. après — aucune valeur lisible, mais `:-webkit-autofill` se met à
   *    correspondre et globals.css lui accroche une animation d'une
   *    milliseconde dont le seul rôle est d'émettre cet `animationstart`.
   *
   * On vérifie le nom de l'animation : le jour où un champ en portera une vraie,
   * elle ne doit pas passer pour un remplissage automatique.
   */
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    if (input.value) setHasValue(true);

    function handleAutofill(event: AnimationEvent) {
      if (event.animationName === AUTOFILL_ANIMATION) setHasValue(true);
    }

    input.addEventListener("animationstart", handleAutofill);
    return () => input.removeEventListener("animationstart", handleAutofill);
  }, []);

  function clear() {
    const input = inputRef.current;
    if (!input) return;

    input.value = "";
    setHasValue(false);

    /* Affecter `.value` ne déclenche aucun événement : `SubmitButton` resterait
       allumé devant des champs vides, sa validation n'ayant jamais été rejouée.
       `bubbles` est indispensable, on écoute sur le <form>. */
    input.dispatchEvent(new Event("input", { bubbles: true }));

    /* Sans ça, le focus reste sur un bouton qui vient de disparaître et la
       tabulation repart du début. */
    input.focus();
  }

  const toneClass = tones[tone];
  const buttonClass = cn(
    "-m-1 flex p-1 transition-colors duration-200",
    toneClass.button,
  );

  /* La réserve à droite dépend du nombre de boutons affichés, pas d'une marge en
     dur : le texte saisi ne doit jamais passer sous les commandes. */
  const controls = (hasValue ? 1 : 0) + (isPassword ? 1 : 0);

  return (
    <div className={className}>
      {/* `htmlFor` plutôt qu'un label enveloppant : un label ne doit pas contenir
          d'autre élément interactif que son champ, et les deux commandes en sont. */}
      <label htmlFor={id} className={cn("eyebrow block", toneClass.label)}>
        {label}
      </label>

      <div className="relative mt-3">
        {/* `outline-none` est compensé par le filet qui passe en pleine couleur
            au focus : un contour rectangulaire ferait apparaître une boîte
            fantôme le temps de la saisie. */}
        <input
          ref={inputRef}
          id={id}
          type={isPassword && revealed ? "text" : type}
          name={name}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          defaultValue={defaultValue}
          minLength={minLength}
          /* `hasContent` et non `value !== ""` : un champ encore en attente
             émettrait un `input` vide, et la croix disparaîtrait d'un champ
             visiblement plein. */
          onChange={(event) => setHasValue(hasContent(event.target))}
          className={cn(
            "h-10 w-full border-b bg-transparent text-base outline-none transition-colors duration-200",
            controls === 2 ? "pr-16" : controls === 1 ? "pr-9" : "pr-0",
            toneClass.input,
          )}
        />

        {/* `-translate-y-px` : le filet occupe la dernière ligne de la boîte, des
            icônes centrées semblaient posées dessus. */}
        <div className="-translate-y-px absolute inset-y-0 right-0 flex items-center gap-3">
          {hasValue && (
            <button
              type="button"
              onClick={clear}
              aria-label={`Effacer le champ ${label.toLowerCase()}`}
              className={buttonClass}
            >
              <ClearIcon />
            </button>
          )}

          {isPassword && (
            <button
              /* Sans `type="button"`, un bouton dans un formulaire vaut
                 `submit` : regarder son mot de passe enverrait le formulaire. */
              type="button"
              onClick={() => setRevealed((shown) => !shown)}
              /* `aria-pressed` plutôt qu'un libellé qui change. */
              aria-pressed={revealed}
              aria-label="Afficher le mot de passe"
              className={buttonClass}
            >
              <EyeIcon crossed={revealed} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Les deux icônes des commandes du champ.

   Elles restent ici, contrairement à `ui/CartIcon` : un œil et une croix ne
   désignent rien du musée, ils n'ont de sens qu'à l'intérieur de ce champ.

   Même trait que les autres icônes : 1.5 d'épaisseur, angles nets,
   `currentColor`, `aria-hidden` puisque le bouton qui les porte est nommé.
   -------------------------------------------------------------------------- */

interface IconProps {
  className?: string;
}

function ClearIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      className={cn("size-4", className)}
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function EyeIcon({ crossed, className }: IconProps & { crossed?: boolean }) {
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
      {/* Le trait barré marque l'état « révélé » : l'icône montre ce qu'on
          obtiendra en cliquant, donc masquer. */}
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
      {crossed && <path d="M4 20 20 4" />}
    </svg>
  );
}
