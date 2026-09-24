import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

/**
 * Lecture de la session côté serveur, pour les pages et les Server Actions.
 *
 * À part de `lib/auth.ts` parce que celui-ci est aussi l'entrée de la CLI :
 * `pnpm db:auth` l'exécute hors de Next, et y importer `next/headers` ferait
 * échouer la commande sur une erreur qui ne parle ni de CLI ni d'en-têtes.
 *
 * `headers()` rend la page dynamique. C'est ce qu'on veut sur une page
 * personnelle et ce qu'on refuse dans le root layout, qui entraînerait tout le
 * site. D'où la règle : session lue sur le serveur dans `/compte`, depuis le
 * navigateur dans le Header.
 *
 * Le `cache()` n'est pas un confort : Better Auth ne mémoïse rien, et le layout
 * de `/compte` comme la page appellent tous deux `requireUser()` — deux
 * allers-retours vers Neon pour une seule requête HTTP. Sa portée est la
 * requête, pas le processus : deux visiteurs ne partagent jamais un résultat.
 *
 * Corollaire : la valeur ne change plus pendant la requête. C'est pourquoi la
 * page des paramètres lit le nom et l'adresse via `lib/account.ts`, qui
 * interroge la base, et non via la session.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});

/**
 * Même chose, mais la page n'existe pas sans compte.
 *
 * La vérification est ici et pas seulement dans un `proxy.ts` : un proxy ne peut
 * que regarder si un cookie est présent, pas s'il est valide, sans interroger la
 * base à chaque navigation. Il sert à rediriger vite, pas à protéger — c'est la
 * position de la documentation de Better Auth.
 *
 * Renvoie l'utilisateur pour que l'appelant enchaîne : `const user = await
 * requireUser()`.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}
