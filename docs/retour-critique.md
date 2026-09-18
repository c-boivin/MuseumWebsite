# Compte-rendu critique

> Livrable attendu au rendu. À tenir **au fil de l'eau** : chaque friction est
> notée le jour où elle est rencontrée, pas reconstituée la veille.

---

## Étape 3 — Branchement de l'API

### 1. `loading.tsx` transforme un 404 en 200

**Le problème.** Un `loading.tsx` déposé dans `app/collection/` s'applique à tout
le sous-arbre, `[slug]` compris. Next enveloppe alors la fiche œuvre dans un
`<Suspense>` et commence à streamer la réponse — donc à envoyer un statut HTTP
200 — avant même que `getArtwork()` ait répondu. Quand `notFound()` s'exécute
ensuite, le statut est déjà parti : `/collection/oeuvre-inexistante` répondait
**200** avec la page 404 dedans. Un « soft 404 », que Google traite comme une
page d'erreur mal déclarée.

**Ce qui l'a rendu difficile à voir.** Visuellement, tout était correct : la
bonne page 404 s'affichait. Seul un `curl -o /dev/null -w "%{http_code}"`
montrait l'écart. Next injecte bien un `<meta name="robots" content="noindex">`
qui limite les dégâts SEO, mais le statut reste faux.

**La correction.** Supprimer `loading.tsx` et descendre la frontière de streaming
*dans* la page liste : un `<Suspense>` qui n'enveloppe que la grille. La fiche
œuvre n'est plus derrière aucune frontière et retrouve son vrai 404 ; la liste
garde son squelette de chargement. Vérifié avec `next start` : 404 sur un slug
inconnu, 200 sur `/collection/the-scream`.

**Ce que ça dit de Next.** Les fichiers spéciaux sont pratiques mais leur portée
est implicite : rien dans le nom `loading.tsx` n'annonce qu'il s'applique aux
routes enfants, ni qu'il a un effet sur les codes HTTP. La documentation le dit,
mais dans une note d'une page qui traite d'autre chose.

### 2. `fetch` n'est plus mis en cache par défaut

Depuis Next 15, un `fetch` sans option n'est plus mis en cache — l'inverse du
comportement de Next 13/14 dont parlent la plupart des tutoriels en ligne. Sans
`next: { revalidate }`, la page Collection serait re-rendue à chaque visite et
ne serait jamais pré-générée au build. Le piège est silencieux : rien ne casse,
le site est juste lent et l'API prend tous les appels.

### 3. Les dimensions d'image, angle mort de `next/image`

`next/image` réclame `width` et `height` pour réserver la place et éviter que la
page saute au chargement. Une image distante arrive comme une simple URL : on ne
connaît pas ses dimensions. Il faut donc passer en mode `fill`, qui exige à son
tour un parent en `position: relative` et un ratio imposé — c'est-à-dire décider
d'un cadrage arbitraire pour des œuvres qui vont du format portrait au panorama.
Choix retenu : cadre au ratio fixe + `object-contain`, quitte à laisser du vide
autour. Rogner une Joconde pour faire une grille régulière n'était pas une option.

### 4. Plus de la moitié des images de l'API ne se chargeaient pas

**Le symptôme.** Des cadres vides dans la grille, sans la moindre erreur dans la
console côté serveur. L'API répondait 200, le JSON était valide, le champ `image`
était rempli sur les 39 œuvres. Tout allait bien — sauf que 22 des 41 URL
d'images renvoyaient un 400, et 2 autres un 404.

**Ce qui l'a rendu difficile à diagnostiquer.** Trois fausses pistes successives :

1. Le `remotePatterns` de `next.config.mjs` — le suspect évident quand une image
   distante ne s'affiche pas. Ce n'était pas ça, les domaines étaient déclarés.
2. Le proxy d'entreprise, qui casse déjà les appels à l'API. Ce n'était pas ça
   non plus : les URL échouaient aussi avec la vérification TLS désactivée.
3. En testant les URL en boucle, Wikimedia a répondu des **429 (trop de
   requêtes)** — qui ressemblent à s'y méprendre à des images cassées. J'ai
   d'abord conclu que 22 images de plus étaient mortes. Il a fallu re-tester en
   espaçant les appels de 4 secondes pour voir qu'elles allaient très bien.

**La vraie cause.** Wikimedia ne génère plus de vignettes à la largeur demandée :
depuis 2025, seule une liste fixe de largeurs est servie, et `2560px` n'en fait
pas partie. Les URL de l'API du prof ont été copiées avant ce changement.

**Ce que ça apprend.** Une API peut être « en ligne et correcte » tout en
pointant vers des ressources mortes. Le contrat de données et la disponibilité
des ressources sont deux choses différentes, et rien dans le code applicatif ne
le signale : il faut aller tester les URL. Sur un vrai produit, c'est exactement
le genre de dégradation silencieuse qui justifie un test automatisé qui vérifie
périodiquement que les médias référencés répondent encore.

### 5. `next/image` télécharge, il ne délègue pas

**Le symptôme.** Sur la page Collection, trois à cinq œuvres s'affichaient sans
visuel — jamais les mêmes d'un chargement à l'autre. Un bug intermittent, donc
difficile à cerner : recharger « corrigeait » le problème pour certaines œuvres
et en cassait d'autres.

**La cause.** `next/image` ne demande pas à l'hébergeur une image redimensionnée :
il la **télécharge** sur notre serveur pour la retailler lui-même. Une grille de
39 œuvres déclenchait donc 39 téléchargements quasi simultanés vers Wikimedia
depuis une seule adresse IP. Wikimedia répond **429 (trop de requêtes)** — mesuré :
24 réponses en erreur sur un chargement à froid.

**Les fausses pistes.** J'ai d'abord allongé les tentatives de rechargement côté
navigateur : de 3 à 5 essais étalés sur quinze secondes. Sans effet — le bridage
dure plus longtemps que ça. J'ai ensuite allongé la durée de cache des images
optimisées, ce qui n'aide pas davantage puisque le problème se produit justement
quand le cache est vide.

**La correction.** Ne pas faire passer ces images par l'optimiseur du tout
(`unoptimized`). Elles désignent déjà une vignette à la largeur voulue, servie par
le CDN de Wikimedia : l'optimiseur n'apportait qu'une conversion de format, pour
le prix d'une requête sortante par image. En les servant telles quelles, c'est le
navigateur qui les demande — à son rythme, et en différé pour celles hors écran.
Résultat mesuré : 39 images sur 39, zéro erreur.

**Ce que ça apprend.** Un outil intégré n'est pas gratuit parce qu'il est
intégré. `next/image` est précieux pour des images qu'on héberge ; devant un CDN
qui redimensionne déjà, il ajoute un intermédiaire et un mode de panne. Savoir
QUAND ne pas utiliser un outil du framework fait partie du travail.

### 6. Deux erreurs à moi, trouvées en simulant une API hostile

Pour vérifier que le site encaisserait une modification de la base du prof, j'ai
monté une fausse API renvoyant six œuvres tordues : sans image, image sur un
domaine non déclaré, URL malformée, fichier mort, type inconnu, année en texte.
Le site a tenu sur tous les cas — mais l'exercice a révélé deux défauts qui
seraient passés inaperçus autrement.

**`.map(fonction)` passe trois arguments.** J'avais écrit
`data.objects.map(toArtworkPreview)` avec un second paramètre optionnel pour la
largeur d'image. `map` appelle sa fonction avec `(élément, index, tableau)` :
l'index atterrissait dans ce paramètre, et le site demandait des vignettes de
**20 pixels**. Le rendu paraissait normal tant qu'on ne regardait pas les URL
générées. Correction : rendre le paramètre obligatoire, pour que l'erreur devienne
impossible plutôt que de compter sur la vigilance.

**Un nettoyage à moitié fait.** `sanitizeRichText()` supprimait bien les blocs
`<script>`, mais `toPlainText()` — qui fabrique la `<meta description>` — se
contentait de retirer les balises. Résultat : la description de la page contenait
`alert(2)` en clair. Inoffensif techniquement, mais ça partait dans les résultats
de recherche et les aperçus de partage. Les deux fonctions partagent désormais la
même première étape.

La leçon est la même dans les deux cas : le code avait l'air juste, les pages
s'affichaient, et seul un jeu de données conçu pour faire mal a montré l'écart.

### 7. Bonne surprise : la séparation données / affichage a tenu

Aucun composant d'affichage n'a eu à changer de structure au branchement de
l'API. `ArtworkCard` et `SelectionGrid` recevaient déjà leurs œuvres en props
depuis un fichier statique ; il a suffi de remplacer la source. Le seul travail
réel a été la fonction de normalisation dans `lib/museum.ts`. C'est l'argument le
plus concret en faveur des Server Components : la page va chercher la donnée, les
composants ne font que l'afficher.

---

## Étape 7 — Animations

### 1. `template.tsx` ne se remonte pas à chaque navigation

**Ce qu'on lit partout.** Pour animer l'entrée d'une page dans l'App Router, on
pose un `app/template.tsx` : contrairement à `layout.tsx`, il est remonté à
chaque changement de route, donc un `useGSAP` à l'intérieur se rejoue. C'est le
conseil donné en cours, et c'est celui de la quasi-totalité des tutoriels et des
réponses Stack Overflow sur le sujet.

**Ce qui est vrai en Next 16.** La documentation de `template.js` précise que
chaque template reçoit une clé **au niveau de son propre segment**, et qu'une
navigation dans un segment plus profond ne le remonte pas. Concrètement, un
`app/template.tsx` porte la clé `/collection` aussi bien pour `/collection` que
pour `/collection/starry-night` : il ne remonte pas entre la grille et la fiche
d'une œuvre.

**Pourquoi ça comptait ici.** C'est précisément le parcours principal du site.
On aurait obtenu une transition qui fonctionne de l'accueil vers la collection,
de la collection vers À propos, et qui disparaît silencieusement au moment où
l'on ouvre une œuvre — c'est-à-dire l'endroit où une transition a le plus de
sens. Le contournement classique (ajouter un `app/collection/template.tsx`) crée
un autre problème : sur `/` → `/collection`, les deux templates se montent
ensemble et l'animation d'entrée se déclenche deux fois.

**La correction.** Ne pas utiliser `template.tsx` du tout. Le panneau est monté
une fois dans le root layout et se déclenche sur le changement de `pathname`,
qui est vrai à toutes les profondeurs de segment. Même schéma que
`ScrollMemoryReset`, écrit à l'étape 3 pour une raison différente.

**Ce que ça dit de Next.** Le risque n'est pas la documentation — elle est
exacte, avec des exemples. Le risque est que les fichiers spéciaux changent de
comportement d'une version majeure à l'autre sans changer de nom : le code
d'un tutoriel de 2024 compile parfaitement, ne produit aucun avertissement, et
ne fait simplement plus ce qu'il annonce. C'est le même piège que le `fetch` non
mis en cache de l'étape 3, et c'est le coût récurrent d'un framework à
conventions implicites.

### 2. Une transition de sortie n'existe pas dans l'App Router

Le routeur n'offre aucun crochet « avant de quitter la page ». Au clic sur un
`<Link>`, la navigation part immédiatement et le DOM qu'on voulait animer a déjà
disparu. Animer l'entrée est gratuit ; animer la sortie oblige à reprendre la
main sur le clic — `preventDefault`, jouer l'animation, puis appeler
`router.push` soi-même — donc à réécrire le composant `Link` du framework.

Le coût réel n'est pas l'animation, c'est tout ce qu'un `<a>` fait gratuitement
et qu'on doit reconstituer à la main : Ctrl/Cmd + clic pour un nouvel onglet,
clic milieu, liens externes, ancres dans la page, lien vers la page courante,
`prefers-reduced-motion`. Six cas d'exception dans `TransitionLink`, contre une
seule ligne utile. C'est la rançon d'une abstraction qui ne prévoit pas
l'interception : on ne peut pas se greffer dessus, il faut la remplacer.

### 3. Lenis et l'aimantation CSS du scroll s'excluent

Le smooth scroll de Lenis ne se combine pas avec `scroll-snap-type` : le README
de la librairie l'annonce en toutes lettres (« no support for CSS scroll-snap »)
et propose un plugin séparé, `lenis/snap`, où les points d'arrêt s'enregistrent
en JavaScript au lieu d'être déclarés en CSS.

Or l'aimantation structure tout le rythme du site — cinq blocs plein écran sur
l'accueil, À propos et la fiche œuvre. Brancher Lenis sans rien faire d'autre la
supprime **sans aucune erreur** : le site continue de fonctionner, il perd juste
ses points de repos, et rien dans la console ne le signale.

**Arbitrage rendu : le défilement amorti, sans l'aimantation.** Le défilement
amorti se ressent sur chaque geste de molette ; l'aimantation ne se jouait qu'aux
frontières de blocs, et la reconstruire avec `lenis/snap` revenait à réenregistrer
les points d'arrêt en JavaScript à chaque changement de route, plus à réintroduire
à la main le décalage du header collant. Du code à maintenir pour retrouver ce que
trois lignes de CSS faisaient. Les règles ont donc été supprimées de `globals.css`
et les repères `data-snap-*` retirés du JSX — les laisser en place aurait entretenu
l'illusion qu'ils servent encore à quelque chose, ce qui est précisément le piège
que cette section décrit.

**Ce que la documentation ne dit nulle part, et qui a coûté le plus de temps :
sur une ancre de la page courante, Lenis et le routeur se disputent le clic.**
Lenis anime la descente ; Next, lui, traite le changement d'ancre comme une
navigation et appelle `scrollIntoView()` sur la cible — un saut sec, au milieu de
l'animation. La page sautait en bas, remontait d'un coup, puis redescendait. Deux
librairies correctes chacune de son côté, un comportement faux une fois ensemble :
c'est la forme que prend le plus souvent une intégration dans cet écosystème. La
parade tient en un mot (`scroll={false}` sur ces liens-là, dans `TransitionLink`),
encore fallait-il savoir lequel des deux acteurs faisait quoi.

### 4. Une 404 recharge tout le site

**Le symptôme.** L'écran de chargement du site se rejouait en arrivant sur la page
404. Impossible en théorie : l'information « l'intro a déjà été jouée » vit dans le
store Zustand, le store vit dans le root layout, et le root layout n'est jamais
démonté d'une page à l'autre.

**La vraie cause**, trouvée dans le routeur de Next
(`client/components/router-reducer/fetch-server-response.js`) :

```js
// If fetch returns something different than flight response handle it like a mpa navigation
// If the fetch was not 200, we also handle it like a mpa navigation
if (!isFlightResponse || !res.ok || !res.body) {
    return doMpaNavigation(responseUrl.toString());
}
```

`res.ok` est faux pour un 404. **Le routeur abandonne donc la navigation côté client et
provoque un rechargement complet du document** — un « MPA », par opposition au « SPA »
qu'est normalement l'App Router. Nouveau document, nouveau store, intro rejouée.

C'était vérifiable indépendamment : la réponse RSC de `/billetterie` est pourtant un
`text/x-component` parfaitement valide. Ce n'est pas le contenu qui fait échouer la
navigation client, c'est uniquement le code de statut.

**Ce que ça coûte au-delà du preloader.** Toute la transition de page est perdue sur ce
trajet : le panneau se referme, puis le navigateur recharge et le panneau n'existe plus.
Plus généralement, aucun état global ne survit à un lien vers une page inexistante — ce
qui vaut aussi pour le panier de la billetterie, à l'étape 5.

**La correction.** Sortir l'information du JavaScript de la page : un `sessionStorage`,
relayé par un script en ligne exécuté pendant l'analyse du HTML. Le script, et non un
effet React, parce que le panneau noir fait partie du HTML envoyé par le serveur — un
effet ne pourrait le retirer qu'après l'hydratation, donc après que l'écran noir a été
peint. Nuance conservée : un rechargement VOLONTAIRE (F5) rejoue l'intro, un rechargement
SUBI la saute. `performance.getEntriesByType("navigation")[0].type` distingue les deux.

**Ce que ça dit de Next.** L'App Router se présente comme une application monopage, et
cette promesse a des exceptions non documentées dans le guide — on ne les trouve qu'en
lisant le source du routeur. Le piège n'est pas la 404 elle-même, c'est que rien n'avertit :
pas d'erreur, pas de log, juste une page qui repart de zéro. Exactement le même profil que
le `loading.tsx` de l'étape 3 et que le `template.tsx` ci-dessus — trois fois de suite, la
panne était un comportement silencieux du framework, jamais une erreur de code.

### 5. Une animation d'entrée se joue derrière le rideau

Deux fois le même bug, à deux endroits, et il faut le comprendre une fois pour le voir
partout : une animation d'arrivée de page se jouait pendant que le panneau de transition
(ou le preloader) couvrait encore l'écran. Quand le panneau s'ouvrait, elle était
terminée — le visiteur arrivait sur un titre posé et ne voyait jamais l'effet.

Le piège est que les deux occurrences ne se manifestent pas au même moment : celle du
preloader ne se voit qu'en RECHARGEANT une page, celle de la transition qu'en NAVIGUANT.
On corrige la première en croyant en avoir fini.

C'est le vrai coût des animations de page : elles introduisent une notion de « l'écran
est-il visible ? » que React ne modélise pas. Le montage d'un composant ne veut plus dire
qu'on le voit. D'où le passage par le store — `isIntroRunning` et `phase` — que
`TextReveal` consulte avant de démarrer, alors qu'il n'a aucun lien de parenté avec les
deux panneaux.

Détail de mise au point qui ne se lit dans aucun tutoriel : rendre la main exactement à la
fin du panneau donne deux temps distincts (une page finie, PUIS une animation). Le signal
est donc levé 0,3 s AVANT, pour que le titre monte pendant que le mur achève sa course.

### 6. Les couches de Tailwind battent la spécificité

Le correctif de la 404 ci-dessus ne marchait pas au premier essai : le panneau
d'intro continuait d'apparaître en flash. La règle qui devait le masquer,
`html[data-intro-done] [data-intro] { display: none }`, est pourtant bien plus
spécifique que ce à quoi elle s'oppose — la classe utilitaire `flex` du panneau,
qui déclare `display: flex`.

La spécificité n'y peut rien. Tailwind v4 range ses utilitaires dans une couche
CSS (`@layer utilities`) et le fichier range ses styles de base dans une autre
(`@layer base`) ; **une couche déclarée plus tard l'emporte toujours sur une
couche déclarée plus tôt, quels que soient les sélecteurs**. Un sélecteur à trois
niveaux dans `base` perd donc contre une classe unique dans `utilities`.

Le CSS qui n'appartient à AUCUNE couche, lui, passe avant toutes les couches. La
règle est donc écrite hors `@layer` — ce qui explique au passage pourquoi le
`<style>` du `<noscript>`, en ligne donc sans couche, fonctionnait déjà.

Ce que ça apprend : avec des couches, « mon sélecteur est plus précis » cesse
d'être un raisonnement valide, et l'outil de diagnostic habituel — comparer les
spécificités dans l'inspecteur — ne dit plus rien d'utile. `!important` aurait
réglé le symptôme, mais aurait masqué la vraie règle du jeu.

### 7. Bonne surprise : un seul fichier connaît la géométrie du logo

Le preloader anime les repères de cadrage du monogramme sans les redessiner : le
composant `Logo` accepte une classe à poser sur chaque rectangle, et l'animation
s'y accroche de l'extérieur. Une seule ligne à changer dans `Logo.tsx` — le
tableau `MARKS` réordonné dans le sens des aiguilles d'une montre, ce qui ne
change rien à l'affichage — a suffi pour que le `stagger` de GSAP produise une
onde qui tourne. Le même composant sert donc de logo dans le header et d'écran de
chargement, sans qu'aucune géométrie soit dupliquée.

---

## Environnement

Sur un réseau d'entreprise qui inspecte le trafic HTTPS, Node refuse de joindre
l'API (`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`) et le site tombe sur son écran
d'erreur. Ce n'est pas un problème de code : le build et le rendu fonctionnent
dès qu'on sort de ce réseau, et sur Vercel. Voir le README pour le contournement.
