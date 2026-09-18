"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AUTOFILL_ANIMATION, hasContent } from "@/lib/autofill";
import { cn } from "@/lib/cn";

interface FieldProps {
  /** Libellé visible du champ. */
  label: string;
  /** Nom du champ dans le formulaire, et identifiant de l'autofill navigateur. */
  name: string;
  type?: "text" | "email" | "password" | "tel";
  /**
   * Indice d'autofill (`email`, `current-password`…). Ce n'est pas un détail :
   * sans lui, un gestionnaire de mots de passe ne reconnaît pas le champ et
   * l'utilisateur doit tout retaper.
   */
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  /**
   * Valeur de départ, pour un formulaire qui MODIFIE plutôt qu'il ne crée —
   * les paramètres du compte, où le nom et l'adresse actuels doivent être là.
   *
   * `defaultValue` et non `value` : le champ reste NON CONTRÔLÉ. C'est tout le
   * parti pris de ce composant et de `SubmitButton` — la saisie appartient au
   * navigateur, React ne la suit pas caractère par caractère. Un `value`
   * obligerait à remonter chaque frappe dans un état, donc à rendre client tous
   * les formulaires qui utilisent ce champ.
   */
  defaultValue?: string;
  /**
   * Longueur minimale, vérifiée par le NAVIGATEUR.
   *
   * Elle double la règle du serveur, elle ne la remplace pas : Better Auth
   * refuse un mot de passe de moins de 8 caractères de son côté. L'intérêt est
   * qu'elle agit avant l'envoi — `SubmitButton` lit `checkValidity()`, donc le
   * bouton reste éteint au lieu de laisser partir une demande qui reviendra
   * refusée.
   */
  minLength?: number;
  /**
   * Fond SUR LEQUEL le champ est posé — même vocabulaire que `Section` et
   * `NavLinks`. Une simple classe de couleur ne suffirait pas : c'est le
   * contraste entre le filet, le texte et le texte d'invite qui doit s'inverser,
   * pas seulement la couleur du texte.
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
 * UN FILET SOUS LE TEXTE, ET NON UNE BOÎTE. Le champ était une capsule pleine,
 * haute de 3rem et bordée sur quatre côtés, dessinée pour répondre au Button —
 * sauf qu'un formulaire en aligne plusieurs : trois capsules empilées pèsent
 * plus lourd que tout le reste de la page, et le site est un musée à fond clair
 * dont la signature graphique est le trait fin. Le filet laisse le texte saisi
 * être l'élément le plus visible du champ, ce qu'il devrait toujours être. Le
 * bouton, lui, garde sa capsule pleine : il reste le seul aplat du formulaire,
 * donc le seul point d'arrivée possible de l'œil.
 *
 * Client Component, et c'est ce que coûtent les deux commandes : il faut savoir
 * si le champ est vide et si le mot de passe est révélé. Le reste de la page de
 * compte — `AuthPanel`, le formulaire, les liens — reste rendu sur le serveur.
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

  /* Pilote l'apparition du bouton d'effacement : rien à effacer dans un champ
     vide. Il part VRAI quand le champ est prérempli, plutôt que d'attendre
     l'effet de montage : le serveur et le navigateur calculent la même chose à
     partir de `defaultValue`, il n'y a donc aucun écart d'hydratation, et la
     croix ne clignote pas à l'arrivée sur les paramètres du compte. */
  const [hasValue, setHasValue] = useState(Boolean(defaultValue));
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === "password";

  /**
   * L'AUTOFILL NE PRÉVIENT PAS, et il ne se laisse même pas lire.
   *
   * Quand le navigateur remplit lui-même l'e-mail et le mot de passe au
   * chargement, il ne déclenche aucun `onChange` — et, sur un formulaire de
   * connexion, Chrome va plus loin : il n'expose pas les valeurs au JavaScript
   * tant que la page n'a reçu aucun geste. Le champ est visiblement plein et
   * `input.value` vaut `""`. La croix d'effacement manque donc précisément là
   * où elle sert le plus, et elle apparaît d'un coup au premier clic.
   *
   * DEUX CAS, DEUX PARADES, ET IL FAUT LES DEUX :
   *
   * 1. Le remplissage a eu lieu AVANT ce montage — l'événement est déjà passé,
   *    mais la valeur, elle, est là : on la relit.
   * 2. Il a lieu APRÈS — aucune valeur lisible, mais la pseudo-classe
   *    `:-webkit-autofill` se met à correspondre, et `globals.css` lui accroche
   *    une animation d'une milliseconde dont le seul rôle est d'émettre cet
   *    `animationstart`. Voir `lib/autofill.ts`.
   *
   * On vérifie le NOM de l'animation plutôt que de réagir à n'importe laquelle :
   * le jour où un champ en portera une vraie, elle ne doit pas passer pour un
   * remplissage automatique.
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

    /**
     * PRÉVENIR LE FORMULAIRE, À LA MAIN.
     *
     * Affecter `.value` en JavaScript ne déclenche AUCUN événement : seule la
     * frappe de l'utilisateur émet un `input`. Tout ce qui écoute le formulaire
     * ignore donc l'effacement, et le symptôme est déroutant — `SubmitButton`
     * reste allumé devant des champs vides, comme si la validation ne marchait
     * pas, alors qu'elle n'a simplement jamais été rejouée.
     *
     * `bubbles: true` est indispensable : l'événement doit remonter jusqu'au
     * <form>, c'est là qu'on l'écoute.
     */
    input.dispatchEvent(new Event("input", { bubbles: true }));

    /* Rendre le curseur au champ : sans ça, l'effacement laisse le focus sur un
       bouton qui vient de disparaître, et la tabulation repart du début. */
    input.focus();
  }

  const toneClass = tones[tone];
  const buttonClass = cn(
    "-m-1 flex p-1 transition-colors duration-200",
    toneClass.button,
  );

  /* Le texte saisi ne doit jamais passer sous les commandes. La réserve dépend
     donc du nombre de boutons réellement affichés, pas d'une marge en dur. */
  const controls = (hasValue ? 1 : 0) + (isPassword ? 1 : 0);

  return (
    <div className={className}>
      {/* `htmlFor` plutôt qu'un `<label>` enveloppant : un label ne doit pas
          contenir d'autre élément interactif que son propre champ, et les deux
          commandes ci-dessous en sont. Avec un label enveloppant, le clic sur le
          libellé pourrait activer la mauvaise cible. */}
      <label htmlFor={id} className={cn("eyebrow block", toneClass.label)}>
        {label}
      </label>

      <div className="relative mt-3">
        {/* `outline-none` est compensé, pas supprimé : le filet passe de
            translucide à pleine couleur au focus. Un contour rectangulaire
            autour d'un champ qui n'a pas de boîte ferait apparaître une boîte
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
          /* `hasContent` et non `value !== ""` : quand Chrome livre enfin les
             valeurs qu'il retenait, il émet un `input` — mais un champ encore
             en attente en émettrait un avec une valeur vide, et la croix
             disparaîtrait d'un champ visiblement plein. */
          onChange={(event) => setHasValue(hasContent(event.target))}
          className={cn(
            "h-10 w-full border-b bg-transparent text-base outline-none transition-colors duration-200",
            controls === 2 ? "pr-16" : controls === 1 ? "pr-9" : "pr-0",
            toneClass.input,
          )}
        />

        {/* `-translate-y-px` : le filet occupe la dernière ligne de la boîte, et
            des icônes centrées à la verticale semblaient sinon posées dessus. */}
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
              /* `type="button"` OBLIGATOIRE : sans lui, un bouton placé dans un
                 formulaire vaut `submit`, et regarder son mot de passe
                 enverrait le formulaire. */
              type="button"
              onClick={() => setRevealed((shown) => !shown)}
              /* `aria-pressed` plutôt qu'un libellé qui change : un lecteur
                 d'écran annonce l'état du bouton sans qu'on ait à écrire deux
                 phrases contradictoires selon le moment. */
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

   Elles restent ici et ne suivent pas `ui/CartIcon` dans son propre fichier :
   celle du panier désigne une PARTIE DU SITE, elle a vocation à resservir. Un
   œil et une croix ne désignent rien du musée — ce sont les deux boutons de ce
   champ, et ils n'ont de sens qu'à l'intérieur. Le jour où l'un des deux sert
   ailleurs, il partira dans `ui/`.

   Même trait que les autres icônes du site : 1.5 d'épaisseur, angles nets,
   `currentColor`, et `aria-hidden` puisque le bouton qui les porte est nommé.
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
      {/* Une amande et sa pupille. Le trait barré marque l'état « révélé » :
          l'icône montre ce qu'on obtiendra en cliquant, donc masquer. */}
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
      {crossed && <path d="M4 20 20 4" />}
    </svg>
  );
}
