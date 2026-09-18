"use client";

import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";

interface CollectionErrorProps {
  error: Error & { digest?: string };
  /** Fourni par Next : relance le rendu du segment sans recharger la page. */
  reset: () => void;
}

/**
 * Filet de sécurité de la section Collection.
 *
 * Il attrape toute erreur levée pendant le rendu — en pratique, l'API Museum
 * injoignable ou en 500. Sans ce fichier, le visiteur tomberait sur l'écran
 * d'erreur générique de Next et perdrait le Header et le Footer.
 *
 * `"use client"` est OBLIGATOIRE ici : un error boundary React s'exécute dans le
 * navigateur, et le bouton a besoin d'un gestionnaire d'événement. C'est l'un des
 * rares endroits du site où la directive n'est pas discutable.
 */
export default function CollectionError({
  error,
  reset,
}: CollectionErrorProps) {
  return (
    <Section spacing="large">
      <div className="max-w-reading space-y-6">
        <p className="eyebrow text-ink-mute">Salle temporairement fermée</p>
        <Heading as="h1" size="title">
          Les œuvres n&apos;ont pas pu être chargées
        </Heading>
        <p className="text-ink-soft text-lead">
          Le catalogue du musée est hébergé sur un service externe, qui ne
          répond pas pour l&apos;instant. Le reste du site reste accessible.
        </p>

        {/* Le détail technique n'intéresse personne en production, mais il fait
            gagner un temps fou pendant le développement. */}
        {process.env.NODE_ENV === "development" && (
          <p className="border-line border-l-2 pl-4 text-ink-mute text-sm">
            {error.message}
          </p>
        )}

        <div className="flex gap-4 pt-2">
          <Button onClick={reset}>Réessayer</Button>
          <Button href="/" variant="secondary">
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    </Section>
  );
}
