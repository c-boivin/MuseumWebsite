# Notes de cours — routes dynamiques

Les 4 notions vues en démo, réécrites **dans la syntaxe Next.js 16** et appliquées à ce
projet. Elles seront mises en pratique à l'étape 4, sur `/collection/[id]`.

> ⚠️ **Le piège n° 1 en Next.js 16 :** `params` et `searchParams` sont des **Promise**.
> Il faut les `await`. Tous les tutoriels d'avant 2025 montrent `params.slug` en accès
> direct — ça ne marche plus.

---

## 1. Route dynamique et slugs

Le nom du **dossier** définit la forme de l'URL.

| Dossier | URL captée | Valeur de `params` |
|---|---|---|
| `app/collection/[id]/` | `/collection/436535` | `{ id: "436535" }` |
| `app/collection/[...slug]/` | `/collection/a/b/c` | `{ slug: ["a","b","c"] }` |
| `app/collection/[[...slug]]/` | `/collection` **et** `/collection/a/b` | `{ slug: undefined }` ou `{ slug: [...] }` |

- `[id]` — **segment dynamique** : capture exactement un segment.
- `[...slug]` — **catch-all** : capture un ou plusieurs segments, sous forme de tableau.
- `[[...slug]]` — **catch-all optionnel** : pareil, mais matche aussi l'URL sans segment.

Pour ce projet, `[id]` suffit : une œuvre a un identifiant numérique unique chez le MET.
Le catch-all servirait plutôt à un `/collection/[...filtres]` — mais on passera les filtres
en `searchParams`, qui est plus adapté.

---

## 2. Lire les params dans la page

```tsx
// src/app/collection/[id]/page.tsx

interface PageProps {
  // Promise, et non un objet simple : c'est LE changement de Next.js 16.
  params: Promise<{ id: string }>;
}

export default async function ArtworkPage({ params }: PageProps) {
  const { id } = await params;

  const artwork = await getArtwork(id);

  return <h1>{artwork.title}</h1>;
}
```

**Pourquoi une Promise ?** Next.js veut pouvoir commencer à rendre la page *avant* de
connaître l'URL exacte, pour streamer le HTML au navigateur plus tôt. Tant que tu n'as pas
fait le `await`, il peut envoyer tout ce qui ne dépend pas de l'identifiant.

---

## 3. `generateMetadata()` — le SEO par page

Les métadonnées d'une page dynamique ne peuvent pas être écrites en dur : le titre dépend
de l'œuvre affichée. `generateMetadata` est la version asynchrone de l'export `metadata`.

```tsx
import type { Metadata } from "next";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const artwork = await getArtwork(id);

  return {
    title: artwork.title,                        // → "Titre — Musée de la Photographie"
    description: `${artwork.artist}, ${artwork.date}`,
    openGraph: {
      images: [{ url: artwork.media.src }],      // l'aperçu partagé sur les réseaux
    },
  };
}
```

**À savoir :** Next.js dédoublonne les appels. Si `generateMetadata` et le composant de page
appellent tous les deux `getArtwork(id)`, la donnée n'est récupérée qu'une fois.

Le `template` défini dans [src/app/layout.tsx](../src/app/layout.tsx) complète
automatiquement le titre — la page n'a donc à fournir que sa partie.

---

## 4. `generateStaticParams()` — pré-générer les pages au build

Sans elle, `/collection/[id]` est rendue **à la demande**, à chaque visite (SSR).
Avec elle, Next.js génère le HTML **au moment du build** (SSG) : la page est alors servie
comme un fichier statique, donc instantanément.

```tsx
export async function generateStaticParams() {
  const ids = await getFeaturedArtworkIds();

  // Chaque objet retourné = une page générée au build.
  return ids.map((id) => ({ id: String(id) }));
}
```

**Le point de décision pour ce projet.** Le département Photographies du MET contient des
milliers d'œuvres. Les pré-générer toutes rendrait le build interminable. La bonne stratégie :

1. `generateStaticParams` ne retourne que les œuvres mises en avant (~50)
2. les autres sont générées **à la première visite**, puis mises en cache (c'est l'**ISR**)
3. `export const dynamicParams = true` (la valeur par défaut) autorise ce comportement ;
   à `false`, toute œuvre non pré-générée renverrait un 404

C'est exactement la démonstration « différents types de rendering » attendue par le sujet :
SSG pour les pages connues, ISR pour la longue traîne, SSR pour la recherche.

---

## Récapitulatif

| Fonction | Quand elle s'exécute | À quoi elle sert |
|---|---|---|
| `generateStaticParams` | au build | dire *quelles* pages pré-générer |
| `generateMetadata` | au rendu de la page | `<title>`, description, Open Graph |
| le composant `Page` | au rendu de la page | l'affichage |
