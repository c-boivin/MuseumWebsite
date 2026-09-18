import type { Metadata } from "next";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  /**
   * Hérité par les deux pages de l'espace, qui n'ont donc pas à le redéclarer.
   *
   * Une page de compte n'a rien à faire dans un moteur de recherche : elle n'a
   * aucun contenu public, et une recherche sur le nom du musée ne doit pas
   * proposer d'entrer dans l'espace personnel de quelqu'un. Même position que
   * les trois pages du parcours de connexion.
   */
  robots: { index: false, follow: false },
};

/**
 * Le layout de l'espace compte : la GARDE, et rien d'autre.
 *
 * ── POURQUOI IL NE DESSINE RIEN ──
 * L'en-tête commun aux deux pages est un composant (`account/AccountHeader`)
 * appelé par chacune d'elles, et non ce layout. La raison est le `<h1>` : il
 * change d'une page à l'autre, et un layout ne peut pas le recevoir de son
 * enfant. Le layout garde donc la seule responsabilité qu'il est le mieux placé
 * pour tenir — celle qui doit s'appliquer à TOUTE page ajoutée ici demain, y
 * compris à celle qu'on oubliera de protéger.
 *
 * ── CE QUE ÇA COÛTE, ET POURQUOI C'EST LE BON ENDROIT POUR LE PAYER ──
 * `requireUser()` lit les en-têtes de la requête : tout ce sous-arbre devient
 * dynamique, plus rien n'y est pré-généré. C'est exactement ce qu'on veut ici —
 * ces pages dépendent de qui regarde — et exactement ce qu'on refuse dans le
 * root layout, qui entraînerait `/collection` et les 39 fiches avec lui.
 *
 * ── LA REDIRECTION N'EST PAS DANS UN `proxy.ts` ──
 * Un proxy ne peut que constater la PRÉSENCE d'un cookie, pas sa validité :
 * un cookie périmé passerait la barrière et la page s'afficherait vide. Il sert
 * à rediriger vite, pas à protéger. Voir `lib/session.ts`.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return <>{children}</>;
}
