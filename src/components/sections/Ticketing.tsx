import { CartSummary } from "@/components/tickets/CartSummary";
import { TicketList } from "@/components/tickets/TicketList";
import { TicketOptions } from "@/components/tickets/TicketOptions";
import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";

/**
 * Le bloc billetterie : la grille tarifaire à gauche, le panier à droite.
 *
 * SERVER COMPONENT, alors que ses trois enfants sont côté client. C'est le
 * découpage recherché : la structure, les titres et la mise en page sont rendus
 * sur le serveur, et seul ce qui a réellement besoin du panier part dans le
 * bundle. Mettre `"use client"` sur cette section aurait entraîné `Section`,
 * `Heading` et `Container` avec elle, pour aucun gain.
 *
 * Deux colonnes et non trois blocs empilés : le total doit rester dans le champ
 * de vision pendant qu'on choisit ses billets, c'est tout l'intérêt d'un panier
 * qui se met à jour en direct. Empilé sous la grille, il ne serait lu qu'après
 * coup et la réactivité ne se verrait jamais.
 */
export function Ticketing() {
  return (
    /* `id` : cible du bouton « Choisir ses billets » du Hero, qui occupe tout le
       premier écran. Sans cette ancre, il faudrait faire défiler à la main pour
       atteindre le premier tarif.

       `compact` : le Hero plein écran au-dessus est déjà serré par ses propres
       marges, cette section ouvre l'écart avec lui sans en rajouter. */
    <Section id="tarifs" spacing="compact">
      <div className="grid grid-cols-[1fr_24rem] items-start gap-16">
        <div className="space-y-12">
          <div className="space-y-6">
            <Heading as="h2" size="heading">
              Tarifs d&apos;entrée
            </Heading>
            <TicketList />
          </div>

          <TicketOptions />
        </div>

        <CartSummary />
      </div>
    </Section>
  );
}
