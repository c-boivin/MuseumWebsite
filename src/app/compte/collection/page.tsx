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
 * C'est la page Collection avec une autre liste : filtres, compteur et grille
 * viennent d'`ArtworkBrowser`. C'est aussi ce qui en fait la page d'arrivée après
 * une connexion (voir `AFTER_AUTH`) — la seule page dont le contenu n'existe que
 * parce qu'on s'est connecté.
 *
 * Deux sources croisées ici : la base ne connaît que des slugs, l'API que des
 * œuvres. Le croisement se fait côté client dans `FavoritesBrowser`, pour que la
 * grille réagisse aux retraits sans recharger.
 *
 * Pas de `<Suspense>` contrairement à `/collection` : là-bas l'en-tête est
 * statique et part avant les données. Ici toute la page est déjà dynamique, rien
 * ne pourrait partir en avance et un squelette n'ajouterait qu'un clignotement.
 */
export default async function AccountPage() {
  /* `requireUser` une seconde fois après le layout : on a besoin de l'`id`, et
     Next ne permet pas de le faire descendre depuis un layout sans contexte. La
     session n'est pas relue pour autant, `getSession` étant mémoïsé. */
  const user = await requireUser();

  /* En parallèle, et ce n'est pas un raffinement : les deux appels partent vers
     des serveurs différents et n'ont aucun besoin l'un de l'autre. Enchaînés, la
     page attendrait la somme des deux temps de réponse. */
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
