import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

/**
 * Lecture du compte depuis la base, et non depuis la session.
 *
 * Pas `getCurrentUser()`, qui est mémoïsé le temps de la requête : c'est ce
 * qu'on veut pour vérifier une identité, pas pour afficher des informations
 * qu'une Server Action vient peut-être de modifier dans la même requête — le
 * formulaire réafficherait l'ancien nom juste après l'avoir changé.
 *
 * C'est aussi ce qui rend le changement d'adresse honnête : Better Auth répond
 * « succès » sans rien changer quand la nouvelle adresse appartient déjà à
 * quelqu'un d'autre (voir `lib/auth.ts`). On ne peut donc pas affirmer que
 * l'adresse a changé — on montre celle qui est réellement enregistrée.
 */
export async function getAccount(userId: string) {
  const [row] = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  /* `undefined` si la ligne a disparu entre la lecture de la session et celle-ci
     — une suppression dans un autre onglet. L'appelant décide quoi en faire
     plutôt que de recevoir un objet vide qui mentirait. */
  return row;
}
