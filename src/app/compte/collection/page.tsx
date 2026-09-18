import type { Metadata } from "next";
import { AccountHeader } from "@/components/account/AccountHeader";
import { FavoritesBrowser } from "@/components/account/FavoritesBrowser";
import { Section } from "@/components/ui/Section";
import { getFavoriteSlugs } from "@/lib/favorites";
import { getArtworks } from "@/lib/museum";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Ma collection",
};

/**
 * L'espace compte s'ouvre sur les œuvres mises de côté.
 *
 * ── C'EST LA PAGE COLLECTION, AVEC UNE AUTRE LISTE ──
 * Mêmes filtres, même compteur, même grille : tout vient d'`ArtworkBrowser`.
 * La seule différence est la liste qu'on lui donne. C'est aussi ce qui explique
 * qu'elle serve de page d'arrivée après une connexion — voir `AFTER_AUTH` dans
 * `lib/auth-actions.ts` : c'est la seule page du site dont le contenu n'existe
 * que parce qu'on s'est connecté, elle prouve donc la connexion en la montrant.
 *
 * ── DEUX SOURCES, CROISÉES ICI ──
 * La base ne connaît que des slugs, l'API ne connaît que des œuvres. On charge
 * donc le catalogue entier comme le fait `/collection` — le même `fetch`,
 * mémoïsé et mis en cache par `lib/museum.ts` — et le croisement se fait côté
 * client dans `FavoritesBrowser`, pour que la grille réagisse aux retraits sans
 * recharger la page.
 *
 * ── PAS DE `<Suspense>` ICI, CONTRAIREMENT À `/collection` ──
 * Là-bas, l'en-tête est statique et part avant les données : le squelette a un
 * sens. Ici toute la page est déjà dynamique — elle a lu la session — donc rien
 * ne pourrait partir en avance. Un squelette n'y ajouterait qu'un clignotement.
 */
export default async function AccountPage() {
  /* `requireUser` une seconde fois après le layout : on a besoin de l'`id` pour
     la requête, et l'aller chercher ici évite de le faire descendre depuis un
     layout — ce que Next ne permet pas sans contexte. La session n'est pas
     relue pour autant, `getSession` étant mémoïsé le temps de la requête. */
  const user = await requireUser();

  /* EN PARALLÈLE, et ce n'est pas un raffinement gratuit : les deux appels
     partent vers des serveurs différents — Neon d'un côté, l'API du musée de
     l'autre — et n'ont aucun besoin l'un de l'autre. Enchaînés avec deux
     `await`, la page attendrait la somme des deux temps de réponse. */
  const [slugs, { artworks }] = await Promise.all([
    getFavoriteSlugs(user.id),
    getArtworks(),
  ]);

  return (
    <Section spacing="compact">
      <AccountHeader
        title="Ma collection"
        lead="Les œuvres que vous avez mises de côté, de la plus récente à la plus ancienne. Les mêmes filtres que la collection du musée s'y appliquent."
      />

      <FavoritesBrowser artworks={artworks} initialSlugs={slugs} />
    </Section>
  );
}
