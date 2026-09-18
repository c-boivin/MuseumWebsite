import { TransitionLink as Link } from "@/components/motion/TransitionLink";
import { Container } from "@/components/ui/Container";
import { mainNavigation } from "@/data/navigation";
import { site } from "@/data/site";
import { AccountLink } from "./AccountLink";
import { CartLink } from "./CartLink";
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
        {/* LOGO ET NAVIGATION FORMENT UN SEUL BLOC, à gauche. Ils étaient
            auparavant deux enfants séparés d'un `justify-between` à trois
            éléments : la navigation flottait alors au milieu de l'écran, sans
            rien à quoi s'aligner, et l'espace se répartissait différemment selon
            la largeur des libellés. Groupés, les trois liens se lisent comme la
            suite du monogramme, et le bloc de droite garde son bord. */}
        <div className="flex items-center gap-12">
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
        </div>

        {/* Bloc de droite : ce qui relève du visiteur lui-même, et non du
            contenu du musée — son panier, son compte. Il est séparé de la
            navigation principale pour cette raison : `Collection`, `Billetterie`
            et `À propos` sont des salles, `Connexion` est une porte de service.

            Ses deux entrées sont les SEULES parties clientes du header, et pour
            la même raison : elles dépendent de quelque chose que le serveur ne
            peut pas connaître sans rendre tout le site dynamique — le panier
            pour l'une, la session pour l'autre. Le reste du header, monogramme
            et navigation principale compris, ne part pas dans le bundle.

            Toutes deux passent par `NavLinks` sous le capot plutôt que par un
            `<Link>` écrit à la main : c'est ce qui leur donne le soulignement de
            page courante et leur `aria-current`. Écrit à part, le lien de compte
            était le seul du header à ne jamais s'allumer. */}
        <div className="flex items-center gap-6">
          <CartLink />

          <AccountLink />
        </div>
      </Container>
    </header>
  );
}
