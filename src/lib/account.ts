import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

/**
 * Lecture du compte DEPUIS LA BASE, et non depuis la session.
 *
 * ── POURQUOI PAS `getCurrentUser()`, QUI RENVOIE DÉJÀ UN UTILISATEUR ──
 * Parce qu'il est mémoïsé le temps de la requête (voir `lib/session.ts`). C'est
 * ce qu'on veut pour vérifier une identité — elle ne change pas en cours de
 * route — mais pas pour AFFICHER des informations qu'une Server Action vient
 * peut-être de modifier dans la même requête : le formulaire réafficherait
 * l'ancien nom juste après l'avoir changé, et le visiteur croirait que son
 * enregistrement n'a pas marché.
 *
 * Cette lecture-ci n'est donc pas mémoïsée, délibérément. Elle sert à une seule
 * page, appelée une fois par rendu.
 *
 * ── ET C'EST CE QUI REND LE CHANGEMENT D'ADRESSE HONNÊTE ──
 * Better Auth répond « succès » sans rien changer quand la nouvelle adresse
 * appartient déjà à quelqu'un d'autre — volontairement, pour ne pas révéler
 * l'existence de ce compte (voir `lib/auth.ts`). On ne peut donc pas affirmer
 * au visiteur que son adresse a changé. On lui montre celle qui est réellement
 * enregistrée, et il en tire lui-même la conclusion : c'est la seule façon
 * d'être exact sans rien dire des autres comptes.
 */
export async function getAccount(userId: string) {
  const [row] = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  /* `undefined` si la ligne a disparu entre la lecture de la session et
     celle-ci — une suppression de compte dans un autre onglet. L'appelant
     décide quoi en faire plutôt que de recevoir un objet vide qui mentirait. */
  return row;
}
