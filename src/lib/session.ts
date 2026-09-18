import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

/**
 * Lecture de la session CÔTÉ SERVEUR, pour les pages et les Server Actions.
 *
 * ── POURQUOI UN FICHIER À PART DE `lib/auth.ts` ──
 * `lib/auth.ts` est aussi l'entrée de la CLI : `pnpm db:auth` l'exécute hors de
 * Next, dans un simple processus Node. Y importer `next/headers` ferait échouer
 * la commande sur une erreur qui ne parle ni de CLI ni d'en-têtes. La
 * configuration et la lecture de requête restent donc séparées.
 *
 * ── CE QUE ÇA COÛTE À LA PAGE QUI L'APPELLE ──
 * `headers()` rend la page DYNAMIQUE : plus de pré-génération, un rendu par
 * visite. C'est exactement ce qu'on veut sur une page personnelle — le contenu
 * dépend de qui regarde, il ne peut pas être calculé à l'avance — et c'est
 * exactement ce qu'on refuse dans le root layout, qui entraînerait tout le site
 * avec lui. D'où la règle du projet : la session se lit sur le serveur dans
 * `/compte`, et depuis le navigateur dans le Header (`layout/AccountLink`).
 *
 * ── LE `cache()` DE REACT N'EST PAS UN CONFORT ──
 * Better Auth ne mémoïse rien : chaque `getSession()` interroge la base pour
 * retrouver la session PUIS l'utilisateur. Or le layout de `/compte` appelle
 * `requireUser()` pour garder la page, et la page l'appelle à son tour pour
 * obtenir l'`id` — deux allers-retours vers Neon pour une seule requête HTTP, à
 * chaque navigation dans l'espace compte. `cache()` les ramène à un.
 *
 * Sa portée est LA REQUÊTE, pas le processus : deux visiteurs ne partagent
 * jamais un résultat. C'est ce qui rend son usage sûr ici, et ce qui le rendrait
 * dangereux avec un cache global.
 *
 * COROLLAIRE À CONNAÎTRE : la valeur ne change plus pendant la requête. Une
 * Server Action qui modifie le compte puis déclenche un nouveau rendu dans la
 * foulée relirait donc l'ancienne. C'est la raison pour laquelle la page des
 * paramètres affiche le nom et l'adresse via `lib/account.ts`, qui interroge la
 * base directement, et non via la session.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});

/**
 * Même chose, mais la page n'existe pas sans compte : on renvoie vers la
 * connexion au lieu de rendre quoi que ce soit.
 *
 * LA VÉRIFICATION EST ICI, DANS LA PAGE, ET PAS SEULEMENT DANS UN `proxy.ts`.
 * Un proxy ne peut que regarder si un cookie de session est présent — il ne
 * peut pas vérifier qu'il est valide sans interroger la base à chaque
 * navigation, y compris sur les images et les fichiers statiques. Il sert donc à
 * rediriger VITE, pas à protéger : la protection est celle-ci, au plus près de
 * la donnée. C'est la position de la documentation de Better Auth, et elle
 * évite le contresens classique qui consiste à tout confier au middleware.
 *
 * Elle renvoie l'utilisateur plutôt que rien, pour que l'appelant enchaîne
 * directement : `const user = await requireUser()`.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}
