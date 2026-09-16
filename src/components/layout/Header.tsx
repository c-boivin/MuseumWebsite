import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { mainNavigation } from "@/data/navigation";
import { site } from "@/data/site";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";

/**
 * En-tête du site, présent sur toutes les pages via le root layout.
 *
 * Server Component : il n'a aucun état ni interaction propre. Seuls ses deux
 * enfants qui en ont besoin (NavLinks, MobileMenu) sont côté client. Le reste
 * — logo, structure, texte — est rendu sur le serveur et n'alourdit pas le
 * bundle JavaScript envoyé au navigateur.
 */
export function Header() {
  return (
    /* `border-paper/15` et non `border-line` : le filet clair du site deviendrait
       une ligne éclatante sur fond sombre. `data-tone` inverse le contour de
       focus, voir globals.css. */
    <header
      data-tone="ink"
      className="sticky top-0 z-50 border-paper/15 border-b bg-ink-deep text-paper"
    >
      <Container className="flex h-header items-center justify-between gap-8">
        {/* Le nom du musée reste dans le DOM, en `sr-only` : sans lui, le lien
            vers l'accueil n'aurait aucun texte accessible — un lecteur d'écran
            annoncerait « lien » et rien d'autre, et le SVG est `aria-hidden`.
            C'est aussi ce que Google lit comme libellé du lien racine. */}
        <Link href="/" className="-m-2 inline-flex p-2">
          <Logo className="size-9" />
          <span className="sr-only">{site.shortName}</span>
        </Link>

        <nav aria-label="Navigation principale">
          <NavLinks
            links={mainNavigation}
            tone="ink"
            className="flex items-center gap-8 font-medium text-sm"
          />
        </nav>

        {/* Emplacement réservé à la barre de recherche (étape « Recherche »). */}
      </Container>
    </header>
  );
}
