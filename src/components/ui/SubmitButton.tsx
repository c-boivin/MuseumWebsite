"use client";

import { useEffect, useRef, useState } from "react";
import { AUTOFILL_ANIMATION, isAutofilled } from "@/lib/autofill";
import { Button } from "./Button";

interface SubmitButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "inverse" | "danger";
  size?: "sm" | "md";
  className?: string;
  /** Classe du conteneur, qui décide de l'alignement dans le formulaire. */
  wrapperClassName?: string;
  /**
   * Éteint le bouton en plus de la règle de validité, jamais à sa place. Sert à
   * couvrir ce que le navigateur ne connaît pas — typiquement un envoi déjà
   * parti, qu'un second clic soumettrait une deuxième fois.
   */
  disabled?: boolean;
}

/**
 * Le formulaire est-il prêt à partir ?
 *
 * `checkValidity()` répond dans tous les cas ordinaires : la règle reste celle
 * du HTML, pas une réécriture.
 *
 * L'exception est obligatoire : Chrome remplit un formulaire de connexion sans
 * exposer les valeurs au JavaScript tant que la page n'a reçu aucun geste. Les
 * champs `required` comptent pour vides et le bouton reste éteint devant un
 * formulaire visiblement complet. Un champ rempli automatiquement est donc traité
 * comme satisfait.
 *
 * Ce n'est pas un contournement : au clic, le geste rend les valeurs au
 * navigateur, qui applique ses propres contraintes. Si elles ne venaient pas, le
 * serveur répondrait « adresse ou mot de passe incorrect » — un refus affiché,
 * là où le bouton éteint ne disait rien.
 */
function isSatisfied(form: HTMLFormElement): boolean {
  if (form.checkValidity()) return true;

  const blocking = Array.from(
    form.querySelectorAll<HTMLInputElement>("input:invalid"),
  );

  /* `length > 0` : `every` répondrait vrai sur une liste vide, et le bouton
     s'allumerait sur un formulaire que le navigateur refuse. */
  return blocking.length > 0 && blocking.every(isAutofilled);
}

/**
 * Bouton d'envoi désactivé tant que son formulaire n'est pas valide.
 *
 * Il se branche tout seul sur le `<form>` qui l'entoure au lieu de recevoir un
 * état : c'est ce qui permet au formulaire et à la page de rester des Server
 * Components. Autrement il faudrait contrôler chaque `<input>`, beaucoup de
 * machinerie pour une question à laquelle le navigateur répond déjà.
 *
 * La validité est celle du HTML : un champ ajouté demain est pris en compte sans
 * toucher à ce fichier, et la règle ne peut pas diverger de celle qui
 * s'appliquera à l'envoi. Une seule exception, voir `isSatisfied`.
 *
 * Le bouton part désactivé au premier rendu, ce qui est exact — un formulaire
 * vide n'est pas valide — donc aucun écart d'hydratation.
 */
export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  wrapperClassName,
  disabled = false,
}: SubmitButtonProps) {
  const root = useRef<HTMLDivElement>(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const form = root.current?.closest("form");
    if (!form) return;

    const update = () => setIsValid(isSatisfied(form));
    update();

    /* `input` couvre la frappe, `change` les champs qui ne l'émettent pas à
       chaque caractère (une case, une liste). */
    form.addEventListener("input", update);
    form.addEventListener("change", update);

    /* L'autofill n'émet ni l'un ni l'autre, mais globals.css accroche une
       animation d'une milliseconde à `:-webkit-autofill` dont le seul rôle est
       d'émettre cet événement. Les événements d'animation remontent, l'écouter
       sur le formulaire couvre donc tous ses champs. Voir `lib/autofill.ts`. */
    const onAnimation = (event: AnimationEvent) => {
      if (event.animationName === AUTOFILL_ANIMATION) update();
    };
    form.addEventListener("animationstart", onAnimation);

    /* Filet pour les navigateurs sans cette pseudo-classe, qui remplissent
       tardivement mais laissent lire les valeurs. */
    const lateCheck = window.setTimeout(update, 500);

    return () => {
      form.removeEventListener("input", update);
      form.removeEventListener("change", update);
      form.removeEventListener("animationstart", onAnimation);
      window.clearTimeout(lateCheck);
    };
  }, []);

  return (
    /* Le conteneur sert d'ancrage pour retrouver le formulaire : `Button` rend
       soit un <button> soit un <Link>, il n'expose pas de ref. */
    <div ref={root} className={wrapperClassName}>
      <Button
        type="submit"
        variant={variant}
        size={size}
        disabled={disabled || !isValid}
        className={className}
      >
        {children}
      </Button>
    </div>
  );
}
