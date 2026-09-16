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

## Environnement

Sur un réseau d'entreprise qui inspecte le trafic HTTPS, Node refuse de joindre
l'API (`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`) et le site tombe sur son écran
d'erreur. Ce n'est pas un problème de code : le build et le rendu fonctionnent
dès qu'on sort de ce réseau, et sur Vercel. Voir le README pour le contournement.
