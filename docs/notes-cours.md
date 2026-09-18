# Notes de cours — routes dynamiques

Les 4 notions vues en démo, réécrites **dans la syntaxe Next.js 16** et appliquées à ce
projet. Elles ont été mises en pratique à l'étape 3, sur `/collection/[slug]`.

> ⚠️ **Le piège n° 1 en Next.js 16 :** `params` et `searchParams` sont des **Promise**.
> Il faut les `await`. Tous les tutoriels d'avant 2025 montrent `params.slug` en accès
> direct — ça ne marche plus.

---

## 1. Route dynamique et slugs

Le nom du **dossier** définit la forme de l'URL.

| Dossier | URL captée | Valeur de `params` |
|---|---|---|
| `app/collection/[slug]/` | `/collection/the-kiss` | `{ slug: "the-kiss" }` |
| `app/collection/[...slug]/` | `/collection/a/b/c` | `{ slug: ["a","b","c"] }` |
| `app/collection/[[...slug]]/` | `/collection` **et** `/collection/a/b` | `{ slug: undefined }` ou `{ slug: [...] }` |

- `[slug]` — **segment dynamique** : capture exactement un segment.
- `[...slug]` — **catch-all** : capture un ou plusieurs segments, sous forme de tableau.
- `[[...slug]]` — **catch-all optionnel** : pareil, mais matche aussi l'URL sans segment.

Pour ce projet, `[slug]` suffit : l'API du cours identifie chaque œuvre par un slug unique,
et l'expose à cette adresse-là (`/objects/the-kiss`). Un slug vaut mieux qu'un identifiant
numérique parce qu'il rend l'URL lisible : elle annonce son contenu avant d'être ouverte,
dans un lien partagé comme dans un résultat de recherche.

Le catch-all servirait plutôt à un `/collection/[...filtres]` — mais les filtres passent en
`searchParams`, qui est plus adapté : ils se combinent et se retirent librement, sans créer
une URL de page par combinaison.

---

## 2. Lire les params dans la page

```tsx
// src/app/collection/[slug]/page.tsx

interface ArtworkPageProps {
  // Promise, et non un objet simple : c'est LE changement de Next.js 16.
  params: Promise<{ slug: string }>;
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { slug } = await params;

  const artwork = await getArtwork(slug);

  // L'API répond 404 pour un slug inconnu, `getArtwork` traduit ça en `null`,
  // et c'est la page qui décide quoi en faire.
  if (!artwork) notFound();

  return <h1>{artwork.title}</h1>;
}
```

**Pourquoi une Promise ?** Next.js veut pouvoir commencer à rendre la page *avant* de
connaître l'URL exacte, pour streamer le HTML au navigateur plus tôt. Tant que tu n'as pas
fait le `await`, il peut envoyer tout ce qui ne dépend pas du slug.

---

## 3. `generateMetadata()` — le SEO par page

Les métadonnées d'une page dynamique ne peuvent pas être écrites en dur : le titre dépend
de l'œuvre affichée. `generateMetadata` est la version asynchrone de l'export `metadata`.

```tsx
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: ArtworkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const artwork = await getArtwork(slug);

  if (!artwork) {
    return { title: "Œuvre introuvable" };
  }

  return {
    title: artwork.title,                        // → "Titre — Musée des Mouvements"
    description: `${artwork.artist}, ${artwork.year}`,
    openGraph: {
      // L'aperçu partagé sur les réseaux. `media` vaut `null` quand aucune
      // reproduction n'est exploitable : mieux vaut aucune image qu'une URL cassée.
      images: artwork.media ? [{ url: artwork.media.src }] : undefined,
    },
  };
}
```

**À savoir :** React mémoïse les `fetch` identiques d'un même rendu. Si `generateMetadata`
et le composant de page appellent tous les deux `getArtwork(slug)`, l'API n'est interrogée
qu'une fois.

Le `template` défini dans [src/app/layout.tsx](../src/app/layout.tsx) complète
automatiquement le titre — la page n'a donc à fournir que sa partie.

---

## 4. `generateStaticParams()` — pré-générer les pages au build

Sans elle, `/collection/[slug]` est rendue **à la demande**, à chaque visite (SSR).
Avec elle, Next.js génère le HTML **au moment du build** (SSG) : la page est alors servie
comme un fichier statique, donc instantanément.

```tsx
export async function generateStaticParams() {
  const slugs = await getArtworkSlugs();

  // Chaque objet retourné = une page générée au build.
  return slugs.map((slug) => ({ slug }));
}
```

**Le point de décision pour ce projet.** Le plan initial visait le département Photographies
du MET : des milliers d'œuvres, impossibles à pré-générer sans un build interminable. La
stratégie prévue était donc de ne pré-générer qu'une cinquantaine d'œuvres mises en avant et
de laisser le reste se générer à la première visite.

L'API du cours a rendu ce compromis inutile : le catalogue tient en **39 œuvres**, et
`getArtworkSlugs()` retourne la liste complète. Les 39 fiches sortent du build.

Ce qu'il reste du raisonnement, et qui est bien en place :

1. l'**ISR** — les `fetch` du client d'API portent `next: { revalidate: 3600 }`
   ([src/lib/museum.ts](../src/lib/museum.ts)) : les pages statiques se régénèrent toutes
   les heures, sans rebuild, donc un cartel corrigé côté API finit par arriver sur le site ;
2. `dynamicParams` garde sa valeur par défaut (`true`) : un slug absent de la liste est
   rendu à la demande, et `notFound()` tranche à ce moment-là. À `false`, toute œuvre non
   pré-générée renverrait un 404 — y compris une œuvre ajoutée au catalogue depuis le build.

C'est la démonstration « différents types de rendering » attendue par le sujet : SSG au
build pour les 39 fiches, ISR à l'heure pour suivre le catalogue, et filtrage **côté
client** sur la page Collection — filtrer côté serveur en lisant `searchParams` aurait rendu
la page dynamique et lui aurait fait perdre son statique, pour le même écran (voir
[src/components/artwork/ArtworkBrowser.tsx](../src/components/artwork/ArtworkBrowser.tsx)).

---

## Récapitulatif

| Fonction | Quand elle s'exécute | À quoi elle sert |
|---|---|---|
| `generateStaticParams` | au build | dire *quelles* pages pré-générer |
| `generateMetadata` | au rendu de la page | `<title>`, description, Open Graph |
| le composant `Page` | au rendu de la page | l'affichage |
