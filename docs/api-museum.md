# API Museum — contrat réel

> La documentation distribuée en cours est incomplète et par endroits fausse. Ce
> fichier décrit ce que l'API renvoie **vraiment**, vérifié en l'interrogeant.
> C'est lui qui fait foi pour le code de `src/lib/museum.ts`.

Base : `https://api-museum.vercel.app`

---

## Écarts entre la doc fournie et la réalité

| Point | Doc du cours | Réalité constatée | Conséquence dans le code |
|---|---|---|---|
| Format de `/objects` | un tableau JSON nu | un objet `{ objects, totalCount, currentPage, totalPages, hasNextPage, hasPrevPage }` | type `MuseumListResponse`, on lit `data.objects` |
| Champ `slug` | absent de la liste des champs, mentionné seulement en note | bien présent sur chaque œuvre, et unique | `slug` est la clé d'URL et la clé React |
| `/objects/{id}` | laisse croire qu'un identifiant marche | `GET /objects/1` répond **404** — seul le slug est accepté | les liens sont construits sur le slug, jamais sur l'`id` |
| Pagination | non mentionnée | `?page=` et `?limit=` fonctionnent | `getArtworks({ page, limit })` |
| Recherche | non mentionnée | `?search=` (titre + artiste) et `?artist=` fonctionnent | prêts pour l'étape Recherche |
| `?movement=`, `?sort=`, `?q=` | — | **ignorés** : renvoient les 39 œuvres sans filtrer | ne pas s'en servir, le filtre par mouvement devra être fait côté serveur chez nous |
| `description` | « la description du tableau » | une chaîne **HTML** (`<p>`, `<strong>`, `<i>`) sur les 39 œuvres | nettoyage obligatoire avant affichage (`lib/sanitize.ts`) |
| Images | — | hébergées sur `upload.wikimedia.org` et `www.moma.org`, dimensions inconnues | `images.remotePatterns` dans `next.config.mjs` + mode `fill` de `<Media />` |
| Champs manquants | « certains champs peuvent parfois manquer » | aujourd'hui aucun ne manque sur les 39 œuvres | on code quand même la tolérance : la doc l'annonce, et une œuvre ajoutée demain peut être incomplète |
| Validité des images | — | **22 URL sur 41 renvoyaient une erreur**, 2 autres pointaient un fichier inexistant | réparation automatique des largeurs + table d'overrides, voir ci-dessous |

## Contenu réel

- **39 œuvres**, qui tiennent sur une seule page par défaut.
- `type` : 34 `painting`, 2 `fresco`, 1 `woodblock print`, 1 `triptych`, 1 `mural`.
  **Aucune photographie** — c'est ce qui a fait basculer le concept du site de la
  photographie vers la peinture.
- `movement` est déjà en **français** ("Surréalisme", "Âge d'or néerlandais"),
  alors que `type` et `description` sont en **anglais**. L'API est bilingue par
  accident ; on traduit `type` via `src/data/artwork-types.ts` et on laisse le
  reste tel quel.
- `gallery` rejoue presque toujours l'image principale en première position : on
  la retire pour ne pas l'afficher deux fois sur la fiche.

## Les images cassées — le piège le plus coûteux

Toutes les œuvres ont bien un champ `image`. Mais **plus de la moitié des URL ne
renvoyaient aucune image**, pour deux raisons distinctes.

### 1. Largeurs de vignette non standard — 22 URL sur 41

Wikimedia ne génère plus de vignette à la largeur qu'on lui demande. Depuis 2025,
seule une liste fixe est servie en accès direct :

`20 · 40 · 60 · 120 · 250 · 330 · 500 · 960 · 1280 · 1920 · 3840`

Toute autre largeur est **rejetée en HTTP 400** (« Use thumbnail sizes listed
on… »). Or l'API du cours est pleine d'URL en `2560px-` et `2880px-` : elles
fonctionnaient quand elles ont été copiées, elles ne fonctionnent plus.

Réparé automatiquement par `src/lib/wikimedia.ts`, qui reconstruit l'URL à la
largeur standard adaptée à l'usage — **960 px** pour une carte de grille,
**1920 px** pour la reproduction d'une fiche (voir `THUMBNAIL_WIDTH` dans
`lib/museum.ts`). Demander 1920 px partout faisait transiter 1,1 Mo par vignette
au lieu de 293 Ko, et déclenchait des **429** sur toute la page.

La base de ce module (liste des largeurs, motif d'URL, `isWikimediaThumbnail`,
`getWikimediaThumbnail`) est le correctif distribué en cours. S'y ajoute
`getWikimediaImageUrl`, qui couvre en plus le cas 3 ci-dessous ; le fichier
indique comment revenir au code du cours seul.

> Source : <https://www.mediawiki.org/wiki/Common_thumbnail_sizes>

### 2. URL pointant le fichier original — 3 URL

Sans `/thumb/`, l'URL désigne le fichier source. Ici les trois concernées sont
légères (40 Ko pour Guernica), mais un original Wikimedia peut peser plusieurs
dizaines de mégaoctets : `next/image` le télécharge pour l'optimiser et abandonne
sur expiration du délai. `getWikimediaImageUrl` les réécrit en vignettes — sûr,
puisque Wikimedia sert une vignette même quand la source est plus petite.

### 3. Noms de fichiers erronés — 2 œuvres

Deux URL désignent un fichier qui n'existe pas sur Wikimedia, à aucune taille :

| Œuvre | Erreur dans l'API |
|---|---|
| *The Fighting Temeraire* | le fichier s'appelle `…last_Berth_to_be_broken.jpg`, l'API écrit `…last_berth_to_be_broken_up.jpg` |
| *The Hay Wain* | bon nom de fichier, mauvais dossier de hash : `b/b6` au lieu de `5/5e` |

Aucune règle ne peut deviner ça : les bonnes URL sont écrites à la main dans
`src/data/image-overrides.ts`, à supprimer si le prof corrige sa base.

### Comment le diagnostiquer soi-même

Le symptôme trompe : l'API répond parfaitement, le JSON est valide, le champ
`image` est rempli. C'est la ressource pointée qui n'existe pas. Il faut sortir
du navigateur et tester les URL une par une :

```bash
curl -sI -A "Mozilla/5.0" "<url de l'image>" | head -1
```

Attention en testant en boucle : Wikimedia renvoie des **429 (trop de requêtes)**
qui ressemblent à des images cassées mais n'en sont pas. Espacer les appels de
quelques secondes, sinon on conclut à tort que tout est mort.

## Et si la base évolue ?

Le prof a confirmé qu'il ne corrigerait pas son API : l'adaptation reste de notre
côté. Le code est malgré tout écrit pour encaisser un changement sans retouche. Ce qui est
traité automatiquement, et ce qui ne l'est pas :

| Changement côté API | Réaction du site |
|---|---|
| Œuvre ajoutée | Elle apparaît dans l'heure (ISR), sa fiche se génère à la première visite |
| Œuvre supprimée | Elle sort de la grille ; son ancienne URL répond un vrai 404 |
| Nouveau `type` (`lithograph`…) | Affiché tel quel en anglais. Ajouter une ligne dans `src/data/artwork-types.ts` pour le traduire |
| Nouveau `movement` | Affiché tel quel — l'API le fournit déjà en français |
| Champ vide ou absent | La ligne disparaît du cartel, aucun « — » disgracieux |
| `year` en texte au lieu d'un nombre | Le champ est ignoré, le reste s'affiche |
| Champ inconnu ajouté | Ignoré sans erreur |
| Œuvre **sans image** | Elle entre quand même au catalogue, avec le cadre de remplacement |
| Image sur un **nouveau domaine** | Détectée à la normalisation → cadre de remplacement. **Action requise** : ajouter le domaine dans `src/lib/image-hosts.ts`, et les deux usages (config Next + validation) suivent |
| Largeur de vignette non standard | Corrigée automatiquement |
| URL pointant le fichier original | Réécrite en vignette, pour ne pas télécharger 30 Mo |
| URL cassée découverte par le navigateur | Trois tentatives espacées, puis cadre de remplacement |
| URL cassée que le prof corrige | L'override de `src/data/image-overrides.ts` ne correspond plus, donc ne s'applique plus. Aucun effet de bord |

Le seul cas qui demande une intervention est le **nouveau domaine d'images** :
c'est volontaire. Accepter n'importe quel domaine transformerait notre optimiseur
d'images en proxy ouvert pour n'importe quel site.

## Erreurs

| Cas | Statut | Corps |
|---|---|---|
| slug inconnu | 404 | `{ "error": "Object not found" }` |
| panne serveur | 500 | `{ "error": "Failed to fetch objects" }` |

Traitement retenu : le 404 devient `null` (l'appelant décide — la fiche œuvre
appelle `notFound()`), tout autre statut lève une exception attrapée par
`app/collection/error.tsx`.
