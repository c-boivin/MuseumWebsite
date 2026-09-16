# Roadmap — Projet Musée

Ordre de réalisation. Le principe directeur : **on ne branche jamais deux inconnues à la
fois.** On construit d'abord une coquille statique propre, puis on y injecte les données,
puis on anime. Si l'API casse en cours de route, le site tient quand même debout.

---

## Arborescence des pages

| Route | Page | Rôle | Étape |
|---|---|---|---|
| `/` | Accueil | Hero, sélection d'œuvres, bloc À propos, teaser billetterie | 2 |
| `/a-propos` | À propos | Histoire du musée, équipe, infos pratiques | 2 |
| `/collection` | Collection | En-tête + grille des 39 œuvres | 3 ✅ |
| `/collection/[slug]` | Œuvre | Fiche complète : cartel, notice, autres vues | 3 ✅ |
| `/billetterie` | Billetterie | Grille tarifaire + sidebar « total » qui s'actualise | 5 |
| `/recherche` | Recherche | Résultats de la barre de recherche du header (`?q=`) | 6 |

Plus les fichiers spéciaux Next.js, qui comptent dans la note (gestion d'erreur + SEO) :
`not-found.tsx`, `error.tsx`, `loading.tsx`, `sitemap.ts`, `robots.ts`, `opengraph-image`.

> **Pourquoi une page `/a-propos` alors que le sujet met « À propos » dans l'accueil ?**
> Les deux. L'accueil porte un bloc court avec un lien « En savoir plus » vers la page
> dédiée. C'est le pattern classique d'un vrai site de musée, et ça donne un second
> parcours de navigation à montrer au jury.

> **Pourquoi `/recherche` et pas juste un dropdown ?** Une page de résultats permet de
> partager une URL, d'être indexée, et surtout de démontrer `searchParams` — explicitement
> listé dans les objectifs du sujet. Le dropdown d'autocomplete du header reste possible
> en plus, il redirige vers cette page.

---

## Étape 1 — Fondations ✅

Objectif : un socle technique sur lequel tout le reste s'empile sans avoir à revenir en arrière.

- [x] Choix actés : TypeScript, UI en français, Tailwind v4, archi par rôle
- [x] Documentation du projet (`CLAUDE.md`, `docs/brief.md`, `docs/roadmap.md`)
- [x] Migration du projet en TypeScript (`tsconfig.json`, `.tsx`)
- [x] Arborescence de dossiers `components/{ui,layout,sections}`, `lib`, `types`, `data`
- [x] Design system minimal : tokens de couleur / typo / espacement dans `globals.css`
- [x] Nettoyage des restes d'exercices (`src/app/posts`, `src/app/api/posts`, `package-lock.json`)

## Étape 2 — Coquille statique *(en cours)*

**Zéro API, zéro animation.** Tout le contenu est en dur dans `src/data/`.

- [x] Composants `ui/` : `Container`, `Section`, `Heading`, `Button`, `Media`
- [x] `layout/Header` : logo + navigation (l'emplacement de la recherche est prévu, vide)
- [x] Desktop uniquement : mobile hors périmètre, aucun breakpoint
- [x] `layout/Footer` : navigation secondaire, horaires, mentions
- [x] Root layout : fonts, métadonnées de base, Header + Footer
- [x] Page d'accueil : `Hero`, `SelectionGrid` (cartes en dur), `AboutIntro`
- [x] Page `/a-propos`
- [x] Typographie fluide desktop (1440 → 1920, puis figée)
- [ ] Relecture visuelle en 1440 et en 1920+ dans un vrai navigateur
- [x] Choix du nom définitif du musée : **Musée des Mouvements**

**Critère de sortie :** une nouvelle page se crée en assemblant des composants existants,
sans écrire une seule nouvelle classe de style de fond.

## Étape 3 — Données de l'API et collection ✅

Le morceau technique le plus risqué. Il a aussi fait basculer le concept du site : l'API
imposée en cours ne contient **aucune photographie**, le musée est devenu un musée de
peinture. Voir [api-museum.md](api-museum.md).

- [x] `lib/museum.ts` : client d'API typé, une fonction par usage (`getArtworks`,
      `getArtwork`, `getArtworkSlugs`)
- [x] Types `MuseumObject` (brut) et `Artwork` / `ArtworkPreview` (site) + normalisation :
      `undefined` → `null`, URL → `ImageMedia`, œuvres sans image écartées
- [x] `next.config.mjs` : `images.remotePatterns` pour `upload.wikimedia.org` et `www.moma.org`
- [x] `lib/sanitize.ts` : le champ `description` est du HTML, il est nettoyé avant affichage
- [x] Stratégie de rendering assumée : SSG au build + ISR à 1 h (`next: { revalidate }`)
- [x] `error.tsx` + `<Suspense>` avec squelette + gestion des œuvres sans image
- [x] `/collection` : en-tête + grille alimentée par l'API
- [x] `/collection/[slug]` : fiche complète (`await params`), cartel, notice, autres vues
- [x] `generateMetadata` + `generateStaticParams` par œuvre (SEO et SSG, 39 pages)
- [x] Accueil branché sur l'API (`?limit=6`), placeholders d'œuvres supprimés

**Piège rencontré, à ne pas réintroduire :** un `loading.tsx` dans `app/collection/`
s'applique aussi à `[slug]` et force un statut 200 sur les œuvres inexistantes. Le
`<Suspense>` est donc à l'intérieur de `page.tsx`. Détail dans
[retour-critique.md](retour-critique.md).

## Étape 4 — Enrichissement de la collection

- [x] **Filtres par siècle et par teinte dominante**, en cases à cocher, état dans l'URL
      (`?siecle=19,20&teinte=bleu`). Les deux critères sont dérivés — l'API ne les fournit
      pas — et le filtrage se fait côté client, les 39 œuvres étant déjà chargées.
      Compteurs par option et cases grisées quand elles ne donneraient aucun résultat.
- [ ] Œuvres similaires en bas de fiche (même artiste via `?artist=`, ou même mouvement)
- [ ] Pagination si le catalogue grossit (`?page=` et `?limit=` fonctionnent déjà)

**Mesuré plutôt que supposé**, avec un Chrome piloté :
- `router.push` ne déclenche **aucune** requête vers la page — Next sert la collection
  depuis son cache client. Le squelette ne clignote pas, le bouton Précédent fonctionne.
  L'argument « il faut nuqs pour éviter l'aller-retour serveur » ne tient donc pas ici.
- Seul défaut du code natif : deux cases cochées **dans la même frame** perdent la
  première. Reproductible uniquement à 0 ms d'écart, c'est-à-dire par deux `.click()`
  programmatiques. Dès 30 ms, tout passe. Laissé tel quel en connaissance de cause.

## Étape 5 — Billetterie

- [ ] Tarifs en dur dans `src/data/tarifs.ts`
- [ ] Sélecteurs de quantité + options (audioguide, guide papier)
- [ ] Sidebar « total » réactive, sticky, qui recalcule à chaque changement
- [ ] Règle métier du tarif groupe (+10 personnes → 15 €/pers.)
- [ ] Introduction de **Zustand** ici : le panier est l'état global qui justifie un store

## Étape 6 — Recherche

- [ ] Champ dans le Header (Client Component, débounce)
- [ ] Page `/recherche?q=` avec résultats côté serveur — l'API expose `?search=`
      (titre + artiste), déjà câblé dans `getArtworks({ search })`
- [ ] Autocomplete (optionnel, bonus)

## Étape 7 — Animations GSAP

Uniquement une fois que tout le site fonctionne sans JS d'animation.

Les composants d'animation iront dans un dossier `components/motion/`, tous en `"use client"`.
La théorie GSAP, les patterns repris du cours M1 et les pièges propres à ce projet sont dans
[gsap.md](gsap.md) — à lire avant d'écrire la première animation.

- [x] `motion/TextReveal` — révélation ligne par ligne, branchée sur le titre des `Hero`
- [ ] Étendre en `<Reveal>` avec une prop (`fade` / `parallax`) plutôt qu'un composant par effet
- [ ] Animation d'arrivée sur l'accueil et sur la fiche œuvre
- [ ] Transition de page (`TransitionLink` + `template.tsx`)
- [ ] Preloader piloté par le `isFirstRender` du store Zustand
- [ ] **Smooth scroll Lenis** (`SmoothScroll` dans le root layout + sync `ScrollTrigger`)
      — pas un bonus : attendu par le prof. Câblage dans [gsap.md](gsap.md) §7
- [ ] Bonus : custom cursor

## Étape 8 — Finition et livrables

- [ ] SEO : `sitemap.ts`, `robots.ts`, Open Graph, données structurées JSON-LD
- [ ] Accessibilité : contrastes, focus visible, `alt` sur toutes les images, navigation clavier
- [ ] Lighthouse : performance, SEO, a11y
- [ ] Déploiement Vercel + variables d'environnement
- [ ] **Compte-rendu critique de Next.js** — à écrire au fil de l'eau, pas la veille du rendu.
      [`docs/retour-critique.md`](retour-critique.md) est ouvert, les frictions de l'étape 3
      y sont déjà notées. Continuer à le remplir sur le moment.
