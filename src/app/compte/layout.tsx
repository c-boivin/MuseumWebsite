import type { Metadata } from "next";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  /**
   * Hérité par les deux pages de l'espace. Une page de compte n'a aucun contenu
   * public, et une recherche sur le nom du musée ne doit pas proposer d'entrer
   * dans l'espace personnel de quelqu'un.
   */
  robots: { index: false, follow: false },
};

/**
 * Le layout de l'espace compte : la garde, et rien d'autre.
 *
 * Il ne dessine rien parce que l'en-tête commun est un composant appelé par
 * chaque page : le `<h1>` change d'une page à l'autre, et un layout ne peut pas
 * le recevoir de son enfant. Le layout garde donc la seule responsabilité qu'il
 * est le mieux placé pour tenir — celle qui doit s'appliquer à toute page ajoutée
 * ici demain, y compris à celle qu'on oubliera de protéger.
 *
 * `requireUser()` lit les en-têtes : tout ce sous-arbre devient dynamique. C'est
 * ce qu'on veut ici, et ce qu'on refuse dans le root layout qui entraînerait les
 * 39 fiches avec lui.
 *
 * La redirection n'est pas dans un `proxy.ts` : un proxy ne peut constater que
 * la présence d'un cookie, pas sa validité — un cookie périmé passerait la
 * barrière et la page s'afficherait vide. Voir `lib/session.ts`.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return <>{children}</>;
}
