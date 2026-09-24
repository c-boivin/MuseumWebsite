# MuseumWebsite — Musée des Mouvements

Site d'un musée de peinture, construit avec Next.js sur l'API
[`api-museum.vercel.app`](https://api-museum.vercel.app) fournie en cours : 39 œuvres
majeures, de la Renaissance italienne au surréalisme.

Projet individuel noté — M2 DEV, ECV.

## Stack

- **Next.js 16** (App Router) + **React 19** (React Compiler)
- **TypeScript**
- **Tailwind CSS v4** — configuration CSS-first dans `src/app/globals.css`
- **Biome** pour le lint et le formatage
- **pnpm** comme gestionnaire de paquets
- Déploiement sur **Vercel**

## Ce que je retiens de Next.js

C'était mon premier vrai projet avec le framework, donc c'est un avis de débutant.

### Ce que j'ai aimé

Aller chercher la donnée directement dans la page. Pas de `useEffect`, pas de state de
chargement à gérer à la main, pas de "loading / error / data" à écrire trois fois. La
page appelle l'API, elle attend, elle rend. C'est beaucoup moins de code que ce que
j'aurais écrit en React seul, et surtout beaucoup moins d'endroits où me tromper.

Le fait que ça m'ait forcé à séparer les données de l'affichage. J'avais commencé avec
un fichier d'œuvres statique ; au moment de brancher la vraie API, aucun composant n'a eu à changer, j'ai juste remplacé la source. Je ne l'avais pas fait exprès, c'est
l'architecture qui pousse dans ce sens.

Le routing par dossiers. Un dossier = une URL, et je sais toujours quel fichier
correspond à quelle page. Après trois semaines sur le projet je m'y retrouvais encore,
ce qui n'est pas rien.

Le build qui attrape les erreurs de types avant moi.

### Les limites

**Les conventions implicites, et les pannes silencieuses.** Poser un `loading.tsx` dans
un dossier suffit à ce que mes pages 404 répondent un code HTTP 200. Rien dans le nom du fichier ne l'annonce, rien ne casse, il faut aller regarder le statut avec `curl` pour le voir. C'est le motif de tout le projet : mes trois plus gros bugs n'ont produit aucune erreur nulle part, et j'ai chaque fois cherché une faute dans mon code avant de
comprendre que c'était le comportement normal du framework.

**Les tutoriels périment très vite.** `fetch` n'est plus mis en cache par défaut depuis
Next 15, et la majorité de ce qu'on trouve en ligne dit l'inverse. La documentation
officielle est juste, mais il faut déjà savoir que la question se pose.

### En résumé

Je referais du Next.js. Le gain sur la partie "aller chercher et afficher de la donnée"
est réel, et le cadre m'a évité pas mal de mauvaises décisions d'architecture. Mais
c'est un framework où il faut connaître les pièges.

## Démarrer

```bash
pnpm install
pnpm dev
```

Le site est servi sur [http://localhost:3000](http://localhost:3000).

### Derrière un proxy d'entreprise

Si la collection s'affiche en erreur et que la console montre
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, le réseau inspecte le trafic HTTPS et Node refuse le
certificat de l'API. Ce n'est pas un bug du site. Deux contournements :

```bash
# Propre : indiquer le certificat racine de l'entreprise
NODE_EXTRA_CA_CERTS=/chemin/vers/ca-entreprise.pem pnpm dev

# Rapide, développement uniquement : désactiver la vérification TLS
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm dev
```

⚠️ **Ces deux lignes sont du Bash.** Dans PowerShell — le terminal par défaut de
VS Code sous Windows — `VARIABLE=valeur commande` n'est pas une syntaxe valide : la
variable n'est pas transmise, le serveur démarre quand même, et l'erreur revient à
l'identique. La forme PowerShell est :

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"; pnpm dev
```

**Symptôme à reconnaître** : les pages déjà visitées s'affichent (le cache de `fetch`
les garde), les autres tombent en erreur. On croit alors à une régression du code alors
que c'est le réseau — une œuvre jamais ouverte échoue, qu'on y arrive par la grille ou
par un lien en bas de fiche.

Aucun des deux n'est nécessaire hors de ce réseau, ni sur Vercel.

## Commandes

| Commande        | Rôle                                                      |
| --------------- | ---------------------------------------------------------- |
| `pnpm dev`    | Serveur de développement                                  |
| `pnpm build`  | Build de production — vérifie aussi les types TypeScript |
| `pnpm lint`   | Biome : lint + format (lecture seule)                      |
| `pnpm format` | Biome : corrige le formatage                               |

## Structure

```
src/
├── app/            Routing (App Router) + tokens de design dans globals.css
├── components/     ui/ · layout/ · artwork/ · sections/
├── lib/            Utilitaires, constantes, appels API
├── types/          Types TypeScript partagés
└── data/           Contenus statiques FR
```

## Documentation

Les conventions de code, les décisions de design et les pièges de Next.js 16
rencontrés sur le projet sont dans [CLAUDE.md](CLAUDE.md).
