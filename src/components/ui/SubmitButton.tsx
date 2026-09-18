"use client";

import { useEffect, useRef, useState } from "react";
import { AUTOFILL_ANIMATION, isAutofilled } from "@/lib/autofill";
import { Button } from "./Button";

interface SubmitButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "inverse" | "danger";
  size?: "sm" | "md";
  className?: string;
  /** Classe du conteneur, qui décide de l'alignement du bouton dans le formulaire. */
  wrapperClassName?: string;
  /**
   * Éteint le bouton EN PLUS de la règle de validité, jamais à sa place : les
   * deux conditions s'additionnent. Sert à couvrir ce que le navigateur ne
   * connaît pas — typiquement un envoi déjà parti, pendant lequel un second
   * clic soumettrait le formulaire une deuxième fois.
   */
  disabled?: boolean;
}

/**
 * Le formulaire est-il prêt à partir ?
 *
 * ── `checkValidity()` D'ABORD, ET C'EST LA RÉPONSE DANS TOUS LES CAS ORDINAIRES ──
 * Elle lit les `required`, les `type="email"`, les `minlength` posés sur les
 * champs : la règle reste celle du HTML, pas une réécriture.
 *
 * ── L'EXCEPTION, ET ELLE EST OBLIGATOIRE ──
 * Chrome remplit un formulaire de connexion sans exposer les valeurs au
 * JavaScript tant que la page n'a reçu aucun geste. Les champs `required`
 * comptent donc pour vides, `checkValidity()` répond faux, et le bouton reste
 * éteint devant un formulaire visiblement complet. Un champ rempli
 * automatiquement est donc traité comme satisfait, même sans valeur lisible —
 * c'est ce que l'utilisateur voit, et l'écran doit lui donner raison.
 *
 * Ce n'est pas un contournement de la validation : au clic, le geste rend les
 * valeurs au navigateur, qui les envoie et applique ses propres contraintes. Si
 * elles ne venaient pas, le serveur répondrait « adresse ou mot de passe
 * incorrect » — un refus prévu et affiché, là où le bouton éteint ne disait rien
 * du tout.
 */
function isSatisfied(form: HTMLFormElement): boolean {
  if (form.checkValidity()) return true;

  const blocking = Array.from(
    form.querySelectorAll<HTMLInputElement>("input:invalid"),
  );

  /* `length > 0` : un formulaire invalide SANS champ invalide n'existe pas en
     pratique, mais `every` répondrait vrai sur une liste vide — et le bouton
     s'allumerait sur un formulaire que le navigateur refuse. */
  return blocking.length > 0 && blocking.every(isAutofilled);
}

/**
 * Bouton d'envoi qui reste désactivé tant que son formulaire n'est pas valide.
 *
 * IL SE BRANCHE TOUT SEUL sur le `<form>` qui l'entoure, au lieu de recevoir un
 * état par ses props. C'est ce qui permet au formulaire et à la page de rester
 * des Server Components : sans ça, il faudrait faire remonter la valeur de
 * chaque champ dans un état React, donc rendre tout le formulaire client, donc
 * contrôler chaque `<input>` — beaucoup de machinerie pour une question à
 * laquelle le navigateur répond déjà.
 *
 * LA VALIDITÉ EST CELLE DU HTML, pas une règle réécrite ici : `checkValidity()`
 * lit les `required`, les `type="email"`, les `minlength` posés sur les champs.
 * Un champ ajouté demain est pris en compte sans toucher à ce fichier, et la
 * règle ne peut pas diverger de celle qui s'appliquera à l'envoi. Elle connaît
 * une seule exception, celle du remplissage automatique : voir `isSatisfied`
 * juste au-dessus.
 *
 * Le bouton part donc DÉSACTIVÉ au premier rendu, ce qui est exact : un
 * formulaire vide n'est pas valide. Il n'y a pas d'écart d'hydratation, l'état
 * initial est le même sur le serveur et dans le navigateur.
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

    /**
     * L'AUTOFILL N'ÉMET NI L'UN NI L'AUTRE, mais il déclenche une animation :
     * `globals.css` en accroche une d'une milliseconde à la pseudo-classe
     * `:-webkit-autofill`, dont le seul rôle est d'émettre cet événement. C'est
     * le seul avertissement que donne le navigateur, et les événements
     * d'animation remontent — il suffit donc de l'écouter sur le formulaire pour
     * couvrir tous ses champs. Voir `lib/autofill.ts`.
     */
    const onAnimation = (event: AnimationEvent) => {
      if (event.animationName === AUTOFILL_ANIMATION) update();
    };
    form.addEventListener("animationstart", onAnimation);

    /* Filet pour les navigateurs sans cette pseudo-classe, qui remplissent
       tardivement mais laissent lire les valeurs — une relecture différée suffit
       alors, et ne coûte rien dans tous les autres cas. */
    const lateCheck = window.setTimeout(update, 500);

    return () => {
      form.removeEventListener("input", update);
      form.removeEventListener("change", update);
      form.removeEventListener("animationstart", onAnimation);
      window.clearTimeout(lateCheck);
    };
  }, []);

  return (
    /* Le conteneur sert de point d'ancrage pour retrouver le formulaire :
       `Button` rend soit un <button> soit un <Link>, il n'expose pas de ref. */
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
