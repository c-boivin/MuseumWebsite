import Link from "next/link";
import { CircularText } from "@/components/ui/CircularText";
import { Container } from "@/components/ui/Container";
import { footerNavigation, mainNavigation } from "@/data/navigation";
import { site } from "@/data/site";

/**
 * Texte du sceau tournant.
 *
 * Il boucle sans fin : le séparateur en fin de chaîne est ce qui évite que la
 * fin du texte colle à son début. Écrit ici plutôt que dans `data/site.ts` :
 * c'est une formulation décorative propre à ce bloc, pas une information sur le
 * musée.
 */
const CIRCULAR_LABEL = "Musée des Mouvements · Paris · ";

/**
 * Pied de page. Server Component : que du contenu statique.
 * Les horaires et l'adresse viennent de `data/site.ts`, jamais écrits en dur ici.
 */
export function Footer() {
  return (
    /* data-tone : inverse le contour de focus (globals.css). Les filets passent
       en paper/15, un border-line clair serait éblouissant sur fond sombre. */
    <footer
      data-tone="ink"
      className="mt-auto border-paper/15 border-t bg-ink-deep text-paper"
    >
      <Container className="grid grid-cols-[1fr_1fr_1fr_auto] gap-12 py-16">
        <div className="space-y-3">
          <p className="font-display text-xl tracking-tight">{site.name}</p>
          <address className="text-paper/70 text-sm not-italic leading-relaxed">
            {site.address.street}
            <br />
            {site.address.zip} {site.address.city}
          </address>
        </div>

        <div className="space-y-3">
          <h2 className="font-medium text-sm">Horaires</h2>
          <ul className="space-y-1.5 text-paper/70 text-sm">
            {site.openingHours.map((slot) => (
              <li key={slot.days} className="flex justify-between gap-4">
                <span>{slot.days}</span>
                <span className="text-paper/50">{slot.hours}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="font-medium text-sm">Navigation</h2>
          <ul className="space-y-1.5 text-paper/70 text-sm">
            {[...mainNavigation, ...footerNavigation].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-paper"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Sceau tournant, en bout de rangée. `auto` sur sa colonne dans la
            grille : il garde son diamètre, les trois colonnes de texte se
            partagent le reste. Purement décoratif — d'où l'aria-hidden posé
            dans le composant. */}
        <div className="flex items-center justify-center">
          <CircularText text={CIRCULAR_LABEL} spinDuration={24} />
        </div>
      </Container>

      <Container className="border-paper/15 border-t py-6">
        <p className="text-paper/50 text-xs">
          © {new Date().getFullYear()} {site.name} — Projet étudiant. Les œuvres
          proviennent d'une base de données publique d'œuvres d'art.
        </p>
      </Container>
    </footer>
  );
}
