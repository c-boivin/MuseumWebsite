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
| `/connexion` `/inscription` `/mot-de-passe-oublie` | Compte | Parcours d'entrée | Comptes ✅ |
| `/compte/collection` | Ma collection | La page Collection, avec les œuvres mises de côté | Comptes ✅ |
| `/compte/collection/[slug]` | Œuvre (privée) | La même fiche, atteinte depuis sa collection | Comptes ✅ |
| `/compte/profil` | Mon profil | Nom, adresse, mot de passe, suppression | Comptes ✅ |

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
- [x] `/collection/[slug]` : fiche complète (`await params`), cartel — la notice est
      arrivée à l'étape 4, et les « autres vues » ont été abandonnées : `gallery` ne
      contient que la reproduction principale, voir CLAUDE.md § Périmètre
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
- [x] **Notice et sortie « Du même artiste » en bas de fiche.** La fiche ne tient plus sur
      un écran : elle en garde un pour la reproduction et son cartel, puis déroule la
      notice (`artwork/ArtworkNotice`) et, quand il y en a, les autres œuvres du peintre
      (`artwork/ArtworkByArtist`), servies par le `?artist=` de l'API.
      **Le détour par un score de proximité a été essayé puis abandonné.** Le plan
      d'origine de cette ligne — « même artiste, ou même mouvement » — ne couvre pas le
      catalogue : six artistes seulement ont plus d'une œuvre, et 17 des 24 mouvements
      n'en désignent qu'une. Une première version additionnait donc quatre critères
      (artiste, mouvement ou famille de mouvement, siècle, teinte) pour ne jamais laisser
      une fiche vide. Elle marchait, et elle a été retirée : le titre « Œuvres similaires »
      n'expliquait pas ce qui reliait les trois toiles proposées à celle qu'on regardait.
      **Choix arrêté : un critère unique, nommé dans le titre, et un bloc absent sur 26
      fiches sur 39** plutôt qu'un rapprochement que la page ne sait pas justifier.
      Le fichier `lib/related.ts` est supprimé.
- [ ] Pagination si le catalogue grossit (`?page=` et `?limit=` fonctionnent déjà)

**Mesuré plutôt que supposé**, avec un Chrome piloté :
- `router.push` ne déclenche **aucune** requête vers la page — Next sert la collection
  depuis son cache client. Le squelette ne clignote pas, le bouton Précédent fonctionne.
  L'argument « il faut nuqs pour éviter l'aller-retour serveur » ne tient donc pas ici.
- Seul défaut du code natif : deux cases cochées **dans la même frame** perdent la
  première. Reproductible uniquement à 0 ms d'écart, c'est-à-dire par deux `.click()`
  programmatiques. Dès 30 ms, tout passe. Laissé tel quel en connaissance de cause.

## Étape 5 — Billetterie ✅

- [x] Tarifs en dur dans `src/data/tarifs.ts`
- [x] Sélecteurs de quantité (`ui/QuantityStepper`) + options en cases à cocher, qui
      réutilisent `ui/CheckboxGroup` comme sa documentation l'annonçait
- [x] Sidebar « total » réactive, sticky, qui recalcule à chaque changement
- [x] Règle métier du tarif groupe (+10 personnes → 15 €/pers.), appliquée en
      `Math.min(prix, 15)` pour ne jamais faire MONTER un tarif déjà inférieur
- [x] Le panier s'ajoute au store **Zustand** déjà créé à l'étape 7 (`lib/store.ts`) —
      il était prévu ici, la transition de page en a eu besoin avant
- [x] Compteur de billets dans le Header (`layout/CartLink`, icône `ui/CartIcon`) : c'est
      lui qui rend l'état réellement global, et donc le store nécessaire
- [x] Accès billetterie depuis l'accueil (`sections/MuseumFigures`) — prévu à l'étape 2
      dans l'arborescence, livré ici. D'abord écrit en « Venir au musée » (horaires,
      adresse, tarif d'appel) puis retourné : le Footer portait déjà l'adresse et les
      horaires sur le même défilement. Ne restent que trois chiffres dérivés — âge du
      musée et cumul de visiteurs depuis `data/site.ts`, prix d'appel depuis
      `data/tarifs.ts` — comptés à l'écran par `motion/CountUp`, et le seul lien de
      l'accueil vers `/billetterie`

**Choix assumés, à défendre en soutenance :**
- Le calcul vit dans `lib/cart.ts`, en fonction **pure**, pas dans le store : l'état retient
  les choix, tout le reste en est dérivé. Même principe que `lib/facets.ts` pour les filtres.
- **Pas de persistance `localStorage`** : le middleware `persist` restaurerait un panier au
  premier rendu client alors que le serveur a rendu un panier vide — un décalage
  d'hydratation à traiter pour un site qui n'encaisse rien.
- **Pas de page de confirmation** : le bouton « Payer » est désactivé et l'annonce. Une
  fausse confirmation n'aurait rien démontré de plus.

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
- [x] **Transition de page** — `motion/TransitionLink` (reprend la main sur le clic) +
      `motion/PageTransition` (le panneau, monté dans le root layout). Un panneau noir monte
      pour recouvrir l'écran, porte le nom de la salle où l'on va, puis continue sa course
      vers le haut sur la nouvelle page. **Pas de `template.tsx`** : en Next 16 il ne se
      remonte pas entre `/collection` et `/collection/[slug]` — voir
      [retour-critique.md](retour-critique.md)
- [x] **Preloader** piloté par `isIntroRunning` dans le store Zustand — monogramme sur fond
      noir, dont les repères de cadrage s'allument en tournant autour du « m ». Une fois par
      chargement complet, jamais en navigation interne
- [x] **Store global Zustand** (`lib/store.ts`) — introduit ici plutôt qu'à l'étape 5 : la
      transition de page a besoin d'un état que trois composants sans lien de parenté
      partagent (le lien qui clique, le panneau qui anime, le `TextReveal` qui attend). Le
      panier de la billetterie s'y ajoutera
- [ ] ~~Bonus : custom cursor~~ — **abandonné**, après trois essais : le monogramme qui
      suit la souris, une palette de peintre dessinée, puis les seules teintes dominantes de
      l'œuvre survolée en pastilles. Les trois rendaient mal, et la raison est la même à
      chaque fois : le site est fait de filets, d'aplats et de reproductions, il n'y a aucune
      autre forme qui flotte par-dessus le contenu — ce qui suit la souris y détonne quoi
      qu'on dessine. Le code et la plomberie associée (`data-hues` sur les œuvres) ont été
      retirés. Ne pas le reproposer sans un parti pris nouveau
- [x] **Smooth scroll Lenis** (`motion/SmoothScroll` dans le root layout, une seule horloge
      via le ticker GSAP, sync `ScrollTrigger`) — pas un bonus : attendu par le prof.
      L'arbitrage qui le bloquait est rendu : Lenis ne supporte pas `scroll-snap`, **on a
      renoncé à l'aimantation** des blocs plein écran plutôt que de la réécrire en
      JavaScript avec `lenis/snap`. Le défilement amorti se ressent à chaque geste,
      l'aimantation ne se jouait qu'aux frontières de blocs. Les règles `scroll-snap-*` et
      les repères `data-snap-*` sont supprimés, pas neutralisés — détail, pièges et parade
      de l'ancre disputée entre Lenis et le routeur dans [gsap.md](gsap.md) §7

## Comptes visiteurs — Neon + Better Auth ✅

Sujet **ajouté en cours de route par le cours**, d'où l'absence de numéro : il n'était pas
dans le découpage d'origine, et il ne s'intercale nulle part — il vient après les animations
et avant la finition. Stack imposée : Better Auth (auth), Drizzle (ORM), Neon (Postgres
serverless).

**Fait :**
- [x] Base Neon créée, chaîne de connexion **pooled** dans `.env.local`
- [x] `drizzle.config.ts`, `src/db/` (connexion + schéma), `src/lib/auth.ts`
- [x] Route attrape-tout `app/api/auth/[...all]/route.ts` — la seule route d'API du site
- [x] Les trois pages de compte branchées : `/connexion` et `/inscription` créent
      réellement un compte et ouvrent une session, `/mot-de-passe-oublie` répond qu'elle
      n'est pas en service
- [x] Commandes `pnpm db:auth` (régénère le schéma d'auth) et `pnpm db:push` (applique à Neon)
- [x] **Parcours vérifié de bout en bout** contre la vraie base : inscription (200, cookie
      `HttpOnly` posé, ligne créée), connexion, mauvais mot de passe, e-mail déjà pris,
      mot de passe trop court. Le compte de test a été supprimé, et sa suppression a
      confirmé la cascade sur `session` et `account`

- [x] **Header qui bascule** Connexion → Mon compte, via `src/lib/auth-client.ts` et
      `useSession` — le premier appel du navigateur à `/api/auth/*`, ce pour quoi la route
      attrape-tout existait. `data/navigation.ts` porte désormais DEUX listes de compte,
      `signedOut` et `signedIn`, et `layout/AccountLink` choisit
- [x] **Déconnexion** (`account/SignOutButton`) — la seule opération de compte qui passe
      par le navigateur et non par une Server Action, parce qu'une Server Action ne peut pas
      vider le cache de `useSession()`
- [x] **Table métier `favorite`** dans `src/db/schema.ts` : clé primaire `(user_id,
      artwork_slug)`, `onDelete: cascade`, aucun index de plus (celui de la clé primaire
      couvre déjà la seule requête posée). Poussée avec `pnpm db:push`
- [x] **Signet sur les cartes et sur la fiche** (`artwork/FavoriteButton`), mise à jour
      optimiste puis retour en arrière si le serveur refuse
- [x] **Page `/compte/collection`** — les favoris, rendus par `ArtworkBrowser` : mêmes filtres siècle
      et teinte, même grille, même compteur. Elle ne redessine rien
- [x] **Page `/compte/profil`** — nom, adresse, mot de passe, suppression du compte
      (mot de passe exigé), en trois formulaires séparés
- [x] **`AFTER_AUTH` passé de `/` à `/compte/collection`** : on arrive désormais quelque part où la
      connexion se VOIT, au lieu d'un accueil identique à celui qu'on venait de quitter
- [x] **Parcours vérifié contre la vraie base** une seconde fois, après l'ajout des
      options `changeEmail` et `deleteUser` : inscription, session, changement d'adresse
      effectif, suppression du compte, session devenue nulle. Compte de test supprimé,
      `pnpm db:push` confirme ensuite « No changes detected »

**Reste à faire :**
- [ ] Compteur de favoris dans le Header — écarté pour l'instant : le panier a besoin de
      dire ce qu'on y a laissé avant de payer, les favoris se consultent sans urgence
- [ ] Réinitialisation de mot de passe et vérification d'adresse, le jour où un service
      d'envoi d'e-mails entre au périmètre. Retirer alors `updateEmailWithoutVerification`
      de `lib/auth.ts` **en premier**
- [ ] `proxy.ts` pour rediriger plus tôt les visiteurs sans cookie. Confort, PAS sécurité :
      la protection reste celle du layout de `/compte`, qui vérifie la session en base

**Choix assumés, à défendre en soutenance :**
- **Server Actions plutôt que le client `authClient`**, à rebours du guide du cours. Le mot
  de passe ne traverse aucun JavaScript de page, `AuthPanel` et les trois pages restent des
  Server Components, et seul `sections/AuthForm` — le bouton et le message d'erreur — passe
  côté client. C'est le plugin `nextCookies()` qui rend ce chemin possible : sans lui la
  session serait créée en base mais son cookie jamais posé.
- **Les messages d'erreur sont traduits**, alors que les données de l'API du musée restent en
  anglais. Ce n'est pas une incohérence : un titre d'œuvre est un nom propre, un message
  d'erreur est une consigne. On s'accroche au `code` de Better Auth et pas à son texte, qui
  peut changer de version en version.
- **Un compte inconnu et un mauvais mot de passe donnent le MÊME message.** L'affiner dirait
  à n'importe qui si une adresse a un compte sur le site.
- **Le champ « Nom » a été ajouté à l'inscription**, qui n'en avait volontairement que deux.
  La colonne `user.name` de Better Auth est non nulle : restait à la remplir d'une chaîne
  vide, à fabriquer un nom depuis l'adresse, ou à le demander. Demander était le seul des
  trois qui ne stocke pas une donnée fausse.
- **Pas de réinitialisation de mot de passe par e-mail** : elle suppose un service d'envoi,
  hors périmètre. La page le dit **avant** la saisie, comme la billetterie annonce que le
  paiement est hors service avant qu'on clique.
- **La session du Header est lue côté CLIENT, et c'est l'arbitrage principal du lot.** Lire
  `headers()` dans le root layout aurait basculé tout le site en rendu dynamique — la
  pré-génération de `/collection` et des 39 fiches, construite à l'étape 3 et explicitement
  demandée par le sujet, aurait disparu pour un libellé de header. La sortie de `pnpm build`
  le prouve : seuls les pages de `/compte` et la route d'API sont en `ƒ`.
- **Les favoris sont en base ; le store Zustand n'en est que le cache d'affichage**, non
  persisté. Il évite 39 requêtes pour 39 cartes et permet à `/collection` de rester
  statique. Son état `null` — « on ne sait pas encore » — est distinct du tableau vide,
  sans quoi le signet clignoterait sur les œuvres justement mises de côté.
- **On passe l'état voulu, pas une bascule** (`setFavorite(slug, true)`). Une bascule
  s'annule quand deux appels partent coup sur coup, et laisse l'œuvre à l'inverse de ce qui
  est affiché.
- **Better Auth répond « succès » à un changement vers une adresse déjà prise, sans rien
  changer** — pour ne pas révéler l'existence de ce compte. On ne corrige pas ce
  comportement : la page affiche l'adresse réellement enregistrée, lue en base, et le
  message n'affirme rien. Même logique que le message de connexion volontairement flou.
- **La base n'est PAS en « Managed Better Auth »** (l'onglet Neon Auth). L'auth reste
  auto-hébergée dans le projet : la configuration est lisible dans `src/lib/auth.ts` au lieu
  d'être enfouie dans une console propriétaire — et c'est justement ce qui est noté.

## Étape 8 — Finition et livrables

- [x] SEO : `sitemap.ts`, `robots.ts`, Open Graph, données structurées JSON-LD
      - `app/robots.ts` — `/compte/` et `/api/` interdits, et **eux seuls** : les pages
        de connexion restent explorables, parce qu'un robot qui n'explore pas une page
        ne lit jamais le `noindex` qu'elle contient. `Disallow` et `noindex` ne
        s'empilent pas sur une même URL.
      - `app/sitemap.ts` — 4 pages fixes + les 39 fiches, listées depuis le `slug` de
        l'API et non depuis un `slugify` du titre (le modèle du cours en propose un ;
        il ferait du sitemap une seconde source de vérité). Le catalogue est enveloppé
        d'un `try/catch` : une API en panne ne doit pas faire échouer un build.
      - `metadataBase` dans le root layout + une canonique **par page** — jamais dans
        le layout, où elle s'hériterait et ferait pointer les 39 fiches vers l'accueil.
      - `app/opengraph-image.tsx` — carte de partage 1200×630 fabriquée au build depuis
        `data/site.ts`. Les fiches œuvres gardent la leur : la reproduction de l'œuvre.
      - JSON-LD : `Museum` sur l'accueil, `VisualArtwork` + `BreadcrumbList` sur chaque
        fiche. Construits dans `lib/structured-data.ts`, publiés par `ui/JsonLd`.
      - ⚠️ Reste à faire au déploiement : poser `NEXT_PUBLIC_SITE_URL` sur Vercel.
        Sans elle, le repli de `lib/site-url.ts` prend le domaine `.vercel.app`.
- [ ] Accessibilité : contrastes, focus visible, `alt` sur toutes les images, navigation clavier
- [ ] Lighthouse : performance, SEO, a11y
- [ ] Déploiement Vercel + variables d'environnement
- [ ] **Compte-rendu critique de Next.js** — à écrire au fil de l'eau, pas la veille du rendu.
      [`docs/retour-critique.md`](retour-critique.md) est ouvert, les frictions de l'étape 3
      y sont déjà notées. Continuer à le remplir sur le moment.
