# museePhoto

Site d'un musée de peinture, construit avec Next.js sur l'API
[`api-museum.vercel.app`](https://api-museum.vercel.app) fournie en cours : 39 œuvres
majeures, de la Renaissance italienne au surréalisme.

> Le dépôt s'appelle encore `museePhoto` : le projet visait d'abord un musée de la
> photographie sur l'API du Metropolitan Museum, avant de basculer sur l'API du cours —
> qui ne contient aucune photographie.

Projet individuel noté — M2 DEV, ECV. Le sujet complet est dans [docs/brief.md](docs/brief.md).

## Stack

- **Next.js 16** (App Router) + **React 19** (React Compiler)
- **TypeScript**
- **Tailwind CSS v4** — configuration CSS-first dans `src/app/globals.css`
- **Biome** pour le lint et le formatage
- **pnpm** comme gestionnaire de paquets
- Déploiement sur **Vercel**

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

Aucun des deux n'est nécessaire hors de ce réseau, ni sur Vercel.

## Commandes

| Commande | Rôle |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production — vérifie aussi les types TypeScript |
| `pnpm lint` | Biome : lint + format (lecture seule) |
| `pnpm format` | Biome : corrige le formatage |

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

| Fichier | Contenu |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Conventions de code, décisions de design, pièges de Next.js 16 |
| [docs/roadmap.md](docs/roadmap.md) | Avancement étape par étape |
| [docs/api-museum.md](docs/api-museum.md) | Contrat **réel** de l'API, et ses écarts avec la doc du cours |
| [docs/retour-critique.md](docs/retour-critique.md) | Compte-rendu critique de Next.js — livrable du rendu |
