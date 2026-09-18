# GSAP — savoir-faire repris du cours M1

Ce fichier est la reprise du cours d'animation de M1 (`CREA_JS_ECV/COURS`), **traduite pour ce
projet**. Les concepts GSAP sont strictement les mêmes ; la façon de les brancher change
complètement, parce que le contexte n'est plus le même.

| | Cours M1 | Ce projet |
|---|---|---|
| Build | Vite | Next 16, App Router |
| JS | vanilla, `class App` + `new App()` | React 19, composants |
| Quand le code tourne | au chargement du script | au montage d'un composant client |
| Styles | SCSS | Tailwind v4 (tokens dans `globals.css`) |
| Sélection | `document.querySelector` | `useRef` + `scope` |
| Nettoyage | méthode `destroy()` appelée à la main | automatique via `useGSAP` |
| Transitions de page | Barba.js | panneau GSAP dans le root layout — **Barba est inutilisable ici, `template.tsx` ne marche pas** |
| Smooth scroll | Lenis (classe maison) | **Lenis** via `lenis/react` (voir §7) |
| Unités | px | **rem uniquement** (voir §8) |

Versions installées et vérifiées : **gsap 3.15.0**, **@gsap/react 2.1.2**, **lenis 1.3.26**.

L'étape 7 de [roadmap.md](roadmap.md) est la cible. Déjà branchés dans
`src/components/motion/` : `TextReveal`, le preloader, la transition de page et **Lenis**
(`SmoothScroll`). Reste le wrapper `<Reveal>` générique.

⚠️ Brancher Lenis a coûté l'aimantation du scroll : l'arbitrage est rendu et expliqué au §7,
à lire avant de remettre le moindre `scroll-snap` dans `globals.css`.

---

## 1. La règle n°1 : `useGSAP`, jamais `useEffect`

C'est le seul vrai changement de fond par rapport au cours. En vanilla, une animation créée au
chargement vit aussi longtemps que la page. En React, un composant se monte et se démonte en
permanence : à chaque navigation client, à chaque changement de filtre. Une animation non
nettoyée survit à son composant, garde une référence à un nœud DOM qui n'existe plus, et
s'empile à chaque remontage.

`useGSAP` (`@gsap/react`) résout ça : il exécute le code au montage et **révoque tout** ce que
GSAP a créé pendant l'exécution au démontage — tweens, timelines, ScrollTriggers, SplitText.
C'est l'équivalent automatique du `destroy()` que le cours écrivait à la main dans
`StickyCards.js`.

```tsx
"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

export function Exemple() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // ".titre" n'est cherché QUE dans root : pas de fuite vers le reste de la page
      gsap.from(".titre", { yPercent: 110, duration: 1, ease: "power4.out" });
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <h2 className="titre">Collection</h2>
    </div>
  );
}
```

Trois choses à retenir :

- **`scope`** remplace `document.querySelector`. Les sélecteurs CSS à l'intérieur du hook sont
  résolus uniquement dans cet élément. C'est ce qui rend un composant d'animation réutilisable
  sur plusieurs sections sans qu'elles se marchent dessus.
- **`dependencies`** : par défaut `[]`, l'animation ne se joue qu'au montage. Pour la rejouer
  quand une donnée change : `{ scope: root, dependencies: [id] }`.
- **`contextSafe`** pour tout ce qui se déclenche **après** le montage (un `onClick`, un
  `onMouseEnter`). Une animation créée dans un handler échappe au nettoyage automatique sinon :

```tsx
const { contextSafe } = useGSAP({ scope: root });

const onEnter = contextSafe(() => {
  gsap.to(".carte", { scale: 1.02, duration: 0.3 });
});
```

`"use client"` est obligatoire sur ces composants, et **uniquement sur eux** : on anime en
enveloppant du contenu rendu côté serveur, on ne transforme pas la page entière en composant
client.

```tsx
// La page reste un Server Component ; seul le wrapper est client.
<Reveal>
  <ArtworkCard artwork={artwork} />
</Reveal>
```

---

## 2. Les plugins sont tous gratuits — le cours dit le contraire

`VITE_SPLITTEXT.md` du cours explique qu'il faut une licence Club GreenSock à 99 $/an pour
SplitText, et propose une « division manuelle » comme contournement. **C'est périmé.** Depuis la
version 3.13, les plugins autrefois payants sont gratuits, y compris en usage commercial.

Vérifié dans ce projet : `node_modules/gsap/` contient bien `SplitText.js`, `ScrollTrigger.js`,
`ScrollSmoother.js`, `Flip.js`, `Observer.js`, `MorphSVGPlugin.js`, `DrawSVGPlugin.js`,
`GSDevTools.js`, `Draggable.js`… avec leurs types TypeScript. Rien à acheter, rien à installer
en plus : **ignorer tout le contournement « division manuelle » du cours.**

L'enregistrement se fait une seule fois par plugin, au niveau du module :

```tsx
"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
```

`useGSAP` fait partie des choses à enregistrer : ça évite les avertissements quand plusieurs
versions de GSAP cohabitent.

---

## 3. Les briques de base

Inchangées par rapport au cours, condensées ici.

```ts
gsap.to(el, { x: 100 });                          // vers l'état donné
gsap.from(el, { opacity: 0 });                    // depuis l'état donné, vers l'état actuel
gsap.fromTo(el, { opacity: 0 }, { opacity: 1 });  // contrôle total
gsap.set(el, { opacity: 0 });                     // instantané, sans animation
```

**Paramètres** : `duration` (secondes), `delay`, `stagger`, `ease`, `repeat` (`-1` = infini),
`yoyo: true` (repart en sens inverse à chaque répétition), `paused: true` (créée mais pas
jouée — voir « Contrôler une animation » plus bas), et les callbacks `onStart` / `onComplete`.

**Easing** — `power1` à `power4`, suffixés `.in` (accélère), `.out` (ralentit à la fin, le plus
naturel pour une apparition), `.inOut`. Puis `back.out` (dépasse et revient), `elastic.out`,
`bounce.out`, `expo.inOut` (très utilisé dans les préloaders du cours), `none` (linéaire,
obligatoire pour une parallaxe).

Deux d'entre eux se règlent entre parenthèses, ce qui change beaucoup le rendu :

```ts
ease: "back.out(1.7)";      // 1.7 = amplitude du dépassement. 1 = discret, 3 = très marqué
ease: "elastic.out(1, 0.3)"; // amplitude, puis période : plus elle est petite, plus ça vibre
```

**Stagger** — décale une animation appliquée à plusieurs éléments :

```ts
gsap.from(".carte", {
  yPercent: 20,
  opacity: 0,
  stagger: 0.1,                                  // 0.1s entre chaque
  // ou : stagger: { each: 0.08, from: "start" } // "center", "end", "edges"
});
```

**Timeline** — enchaîne sans calculer les délais à la main :

```ts
const tl = gsap.timeline({ defaults: { duration: 1, ease: "power4.out" } });

tl.from(".titre", { yPercent: 110 })
  .from(".sous-titre", { opacity: 0 }, "<")     // en même temps que la précédente
  .from(".bouton", { scale: 0 }, "-=0.3");      // 0.3s avant la fin
```

| Position | Sens |
|---|---|
| `">"` (défaut) | après la précédente |
| `"<"` | en même temps que la précédente |
| `"<0.5"` | 0.5s après le début de la précédente |
| `"+=1"` / `"-=0.5"` | 1s après / 0.5s avant la position courante |
| `2` | à 2s absolues dans la timeline |

> Ces valeurs sont des **paramètres de position**, pas des labels — les deux notions sont
> souvent confondues. Un label est un marqueur nommé qu'on pose soi-même, et sur lequel on
> peut ensuite se caler *ou* sauter :
>
> ```ts
> tl.addLabel("texte").from(".titre", { yPercent: 110 });
> tl.from(".bouton", { scale: 0 }, "texte+=0.2"); // 0.2s après le label
> tl.play("texte");                                // saute directement à ce point
> ```
>
> Ça devient utile dès que la timeline dépasse trois étapes : un label survit à l'insertion
> d'une animation au milieu, un `"-=0.5"` non.

**Contrôler une animation** — un tween ou une timeline gardé dans une variable se pilote :

```ts
const anim = gsap.to(el, { x: 100, paused: true });

anim.play();
anim.pause();
anim.reverse();   // rejoue à l'envers depuis la position courante
anim.restart();
anim.kill();      // détruit et libère l'élément
anim.progress(0.5); // se place à 50 % sans jouer
anim.timeScale(2);  // vitesse x2
```

**En React, le « dans une variable » est le piège.** Une `const` dans le corps du composant
est recréée à chaque rendu, et une variable de module serait partagée entre toutes les
instances. L'animation se range donc dans un `useRef`, se crée dans `useGSAP`, et se pilote
depuis un handler rendu `contextSafe` :

```tsx
const root = useRef<HTMLDivElement>(null);
const anim = useRef<gsap.core.Timeline | null>(null);

const { contextSafe } = useGSAP(
  () => {
    anim.current = gsap
      .timeline({ paused: true })
      .to(".panneau", { xPercent: 0, duration: 0.5, ease: "power3.out" });
  },
  { scope: root },
);

const toggle = contextSafe(() => {
  const tl = anim.current;
  if (!tl) return;
  tl.reversed() ? tl.play() : tl.reverse();
});
```

Pas besoin d'appeler `kill()` au démontage : `useGSAP` le fait.

---

## 4. ScrollTrigger

Deux modes, et c'est tout :

```ts
// Mode 1 — déclenché une fois, l'animation joue à sa propre vitesse.
// C'est le mode d'une apparition de contenu.
scrollTrigger: { trigger: el, start: "top 75%", once: true }

// Mode 2 — scrub : l'animation EST la barre de scroll, elle avance et recule avec lui.
// C'est le mode d'une parallaxe ou d'un pin.
scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 }
```

`start: "top 75%"` se lit « quand le **haut de l'élément** atteint **75 % de la hauteur du
viewport** ». Premier mot = l'élément, second = l'écran. `scrub: 1` lisse sur 1 seconde ;
`scrub: true` colle exactement au scroll, plus sec.

`markers: true` affiche les repères de debug. À retirer avant de committer.

**Callbacks** : `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack`, et `onUpdate: (self) =>` avec
`self.progress` (0 → 1) et `self.direction` (1 bas, -1 haut). Tout l'effet « sticky cards » du
cours repose sur `onUpdate` + `gsap.set`, pas sur des tweens.

**Pin** — épingle un élément pendant que le scroll continue :

```ts
ScrollTrigger.create({
  trigger: section,
  start: "top top",
  end: "+=100vh",
  pin: true,
  pinSpacing: true,
});
```

---

## 5. SplitText

```ts
const split = SplitText.create(".titre", {
  type: "lines",        // "words", "chars", ou "lines,words,chars"
  mask: "lines",        // enveloppe chaque ligne dans un conteneur overflow:hidden
  linesClass: "line++", // line1, line2, line3…
});

gsap.from(split.lines, {
  yPercent: 110,        // la ligne part sous son masque, donc invisible
  duration: 1,
  stagger: 0.1,
  ease: "power4.out",
});
```

`mask` est ce qui donne l'effet « le texte monte depuis le vide » du cours : sans masque, la
ligne est simplement décalée vers le bas et reste visible par-dessus le reste.

**Le piège de ce projet : les polices.** SplitText mesure les lignes au moment où il s'exécute.
Le site charge Outfit et Instrument Serif via `next/font`. Si le découpage se fait avant que la
police soit appliquée, les retours à la ligne sont calculés sur la police de fallback, et le
texte se retrouve mal coupé une fois la vraie police arrivée. D'où :

```ts
useGSAP(() => {
  document.fonts.ready.then(() => {
    const split = SplitText.create(".titre", { type: "lines", mask: "lines" });
    // …animation
  });
}, { scope: root });
```

`split.revert()` restaure le texte d'origine — utile pour l'accessibilité et le copier-coller.
`useGSAP` s'en charge automatiquement au démontage.

---

## 6. Les patterns du cours, traduits

### Reveal de texte (`copy.js`)
Le cours scanne `[data-copy]` dans tout le document. Ici, ça devient un composant `<Reveal>` qui
enveloppe ses enfants et expose une prop (`type: "lines" | "words" | "fade" | "parallax"`),
conformément à la convention de composants du projet — une prop plutôt que quatre composants.

### Parallaxe d'image (`image.js`)
Inchangé, sauf que la cible est le `<Image>` de `next/image` :

```ts
gsap.fromTo(img, { yPercent: -10 }, {
  yPercent: 10,
  ease: "none",
  scrollTrigger: { trigger: container, start: "top bottom", end: "bottom top", scrub: 1 },
});
```

Le conteneur doit avoir `overflow-hidden`, et l'image être plus haute que lui, sinon on voit les
bords.

### Sticky cards / pin (`StickyCards.js`, `StickyColumns.js`)
Transposable tel quel dans un `useGSAP`. Le `destroy()` manuel et le tableau `scrollTriggers`
disparaissent : `useGSAP` nettoie. Attention, c'est le pattern le plus coûteux en scroll — à
réserver à une seule section.

### Marquee (`Marquee.js`)
La fonction `createHorizontalLoop` est réutilisable telle quelle (c'est un helper officiel
GSAP). La partie qui accélère le défilement selon la vitesse de scroll lit la vélocité de
Lenis — récupérable ici via `useLenis((lenis) => …)` plutôt que par le `lenis.on("scroll")` du
cours.

### Preloader (`intro2.js`)
Le cours le lance au chargement du script. Ici il faudra le piloter par un état global — la
roadmap prévoit Zustand à l'étape 5 avec un `isFirstRender`, pour qu'il ne se rejoue pas à
chaque navigation client.

### Transitions de page — **Barba.js est à oublier**
Barba intercepte les clics, récupère le HTML de la page suivante et remplace un conteneur.
L'App Router fait déjà exactement ça, avec son propre routeur. Les deux ne peuvent pas
coexister : Barba casserait le routage React. Deux remplacements :

**a. `<ViewTransition>` de React** — sans configuration en Next 16. C'est la réponse au cas « la
vignette de la grille devient l'image de la fiche œuvre », qui est précisément notre
`/collection` → `/collection/[id]` :

```tsx
import { ViewTransition } from "react";

<ViewTransition name={`oeuvre-${id}`}>
  <Image src={src} alt={alt} />
</ViewTransition>
```

Même `name` des deux côtés, le navigateur anime la position et la taille entre les deux. Voir le
guide complet dans `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` — son
exemple est une galerie photo.

**b. Un panneau dans le root layout + GSAP** — pour l'effet « volets qui balaient l'écran »
du cours. C'est la solution retenue, et elle est **écrite** : `motion/PageTransition` et
`motion/TransitionLink`, pilotés par le store `lib/store.ts`.

> ⚠️ **Et surtout PAS un `template.tsx`, contrairement à ce qu'on lit partout** — y compris
> dans le cours. L'argument habituel est qu'un template, à la différence d'un layout, est
> remonté à chaque navigation. **C'est faux en Next 16** : la doc de `template.js` précise
> que chaque template reçoit une clé au niveau de SON PROPRE SEGMENT, et qu'une navigation
> dans un segment plus profond ne le remonte pas. Un `app/template.tsx` porte donc la même
> clé pour `/collection` et pour `/collection/starry-night` : aucune transition entre la
> grille et la fiche, c'est-à-dire pile sur le parcours principal du site. Le déclencheur
> est le `pathname`, qui lui est vrai à toutes les profondeurs.

L'animation de **sortie** n'est de toute façon pas gratuite, quel que soit le point
d'accroche : l'App Router n'a aucun crochet « avant de quitter la page ». Il faut reprendre
la main sur le clic et retarder la navigation soi-même, en trois temps —
(1) lire où le lien mène, (2) jouer l'animation, (3) `router.push` à la fin.

Recommandation : `<ViewTransition>` pour le lien vignette → fiche si on l'ajoute un jour,
le panneau pour la transition générique. Ne pas empiler les deux sur la même navigation.

---

## 7. Smooth scroll — Lenis

**Décision actée : Lenis est au périmètre.** Il remplace le scroll natif par un défilement
amorti. Ce n'est pas du GSAP : c'est une librairie indépendante (`lenis`, 1.3.26) qui prend la
main sur le scroll de la page.

Le cours écrivait une classe `LenisScroll.js` à la main. Inutile ici : Lenis publie un point
d'entrée React officiel, `lenis/react`, qui expose `<ReactLenis>` et `useLenis()`. Le fichier
est déjà marqué `"use client"`, donc il s'importe directement depuis le root layout qui, lui,
reste un Server Component.

### Le câblage

```tsx
// src/components/motion/SmoothScroll.tsx
"use client";

import gsap from "gsap";
import { ReactLenis, type LenisRef } from "lenis/react";
import { useEffect, useRef } from "react";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  // Lenis et GSAP ont chacun leur boucle d'animation. En laisser tourner deux,
  // c'est deux horloges légèrement décalées, donc du tremblement sur les
  // animations liées au scroll. On coupe celle de Lenis (autoRaf: false) et on
  // le fait avancer depuis le ticker de GSAP : une seule horloge.
  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000); // le ticker donne des secondes, Lenis attend des ms
    }

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
    };
  }, []);

  return (
    <ReactLenis root ref={lenisRef} options={{ autoRaf: false, anchors: true }}>
      {children}
    </ReactLenis>
  );
}
```

Puis dans `src/app/layout.tsx`, en enveloppant `<Header />`, `<main>` et `<Footer />`. Il faut
aussi importer la feuille de style de Lenis, une fois, dans `globals.css` :

```css
@import "lenis/dist/lenis.css";
```

Sans elle, la page garde le comportement de hauteur du scroll natif et l'amortissement est
cassé.

### Synchroniser ScrollTrigger

Dès que ScrollTrigger arrivera, il faudra lui dire de se recalculer au rythme de Lenis, sinon
les déclenchements seront en retard sur ce que voit l'utilisateur :

```tsx
useLenis(() => ScrollTrigger.update());
```

### Ce qu'il ne faut pas recopier du cours

- **La config verbeuse.** `LenisScroll.js` passe `duration: 1.2`, `easing`, `orientation`,
  `smoothWheel`, `normalizeWheel`… La fonction d'easing du cours est *exactement* la valeur par
  défaut de Lenis (`(t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))`). Partir des défauts et ne
  toucher qu'à ce qui gêne vraiment.
- **Le `destroy()` manuel.** `<ReactLenis>` s'en charge au démontage.

### ⚠️ Lenis a coûté l'aimantation du scroll — arbitrage rendu

Le README de Lenis 1.3.26 est explicite : « no support for CSS scroll-snap, you must use
`lenis/snap` ». Or le site reposait sur `scroll-snap-type: y proximity` et ses deux repères
`[data-snap-section]` / `[data-snap-center]` — cinq blocs plein écran sur l'accueil, À
propos et la fiche œuvre. Brancher `<ReactLenis>` tel quel les désactive **en silence** :
aucune erreur, aucun avertissement, le site perd simplement ses points de repos.

**Décision : on garde le défilement amorti, on renonce à l'aimantation.** Le raisonnement,
pour qu'il puisse être contesté : le défilement amorti se ressent sur CHAQUE geste de
molette, l'aimantation ne se jouait qu'aux frontières de blocs, et la reconstruire avec
`lenis/snap` voulait dire réenregistrer les points d'arrêt en JavaScript à chaque changement
de route et réintroduire à la main le décalage du header collant — du code à maintenir pour
retrouver ce que trois lignes de CSS donnaient. Le plugin reste dans le paquet
(`node_modules/lenis/dist/lenis-snap.mjs`) si le rythme manque vraiment.

Ce qui a été fait au même moment, et qu'il ne faut pas défaire :

- les règles `scroll-snap-*` sont **supprimées** de `globals.css`, avec un commentaire à
  leur place. Les laisser aurait entretenu l'illusion qu'elles font quelque chose ;
- `data-snap-section` (`ui/Section`) et `data-snap-center` (`sections/AboutStatement`) sont
  retirés du JSX ;
- le `scroll-behavior: smooth` de `<html>` est retiré — Lenis le remplace — et avec lui le
  `data-scroll-behavior="smooth"` du root layout, qui n'existait que pour le neutraliser le
  temps d'une navigation ;
- `scroll-padding-top`, lui, **reste** : le `scrollTo` de Lenis le lit (vérifié dans
  `lenis.mjs`), les ancres se calent donc toujours sous le header.

**Statut : branché.** `motion/SmoothScroll`, monté dans le root layout autour du Header, du
`<main>` et du Footer.

### L'ancre et le routeur se disputaient le même clic

Le piège d'intégration, qui ne se voit dans aucune documentation : sur une ancre de la page
courante (`#tarifs`, ou l'icône panier une fois sur `/billetterie`), **deux** acteurs
répondent au clic. Lenis anime la descente, pendant que Next traite le changement d'ancre
comme une navigation et appelle `scrollIntoView()` sur la cible — un saut sec. Résultat : la
page saute en bas, remonte d'un coup là où Lenis en est de son animation, puis redescend.

La parade est dans `motion/TransitionLink` : `scroll={false}` sur les seules ancres de la
page courante. L'URL reçoit bien son `#`, l'historique aussi ; seul le saut du routeur est
retiré. Les ancres vers une AUTRE page (l'icône panier depuis l'accueil) gardent le
comportement de Next, puisque Lenis, lui, ne les traite pas.

### Deux options de moins dans la documentation officielle

- `allowNestedScroll: true` — les zones à ascenseur propre (colonne de filtres de la
  collection, liste du panier, cartel de la fiche œuvre) redeviennent scrollables à la
  molette, sans avoir à poser un `data-lenis-prevent` sur chacune.
- `smoothWheel: false` quand `prefers-reduced-motion` est actif. L'option
  `respectReducedMotion` de Lenis ne suffit PAS : dans la version 1.3.26, elle n'est lue que
  par `scrollTo()` (un seul `if` dans `lenis.mjs`), donc l'amortissement de la molette reste
  actif. C'est pourtant la seule animation du site qui touche à chaque geste.

### Deux points de vigilance propres à ce site

- **Le lien d'évitement.** `layout.tsx` a un « Aller au contenu » qui pointe vers `#contenu`.
  Lenis capturant le scroll, un lien d'ancre natif peut ne plus rien faire — c'est un vrai
  problème d'accessibilité, pas un détail cosmétique. D'où `anchors: true` dans les options
  ci-dessus, qui laisse Lenis gérer les ancres. **À tester au clavier** une fois branché.
- **Les zones scrollables imbriquées.** Si une sidebar ou une modale a son propre scroll, il
  faut lui poser `data-lenis-prevent`, sinon Lenis intercepte la molette au niveau de la page.

---

## 8. Pièges spécifiques à ce projet

**Le `rem` est fluide — ne jamais animer en px.**
`globals.css` fixe `font-size: calc(100vw / 1440 * 16)`. Toutes les cotes du site suivent la
largeur du viewport. Une animation en px (`y: 80`) serait la seule valeur figée du site : juste à
1440px, fausse partout ailleurs. Donc :

- `yPercent` / `xPercent` plutôt que `y` / `x` — relatifs à la taille de l'élément, ils suivent
  l'échelle tout seuls. C'est le choix par défaut.
- si une valeur absolue est vraiment nécessaire, l'écrire en rem : `y: "5rem"`.
- `scale`, `opacity`, `rotation`, `clipPath` ne sont pas concernés : ils sont déjà relatifs.

**Tailwind et GSAP écrivent dans deux propriétés CSS différentes.**
Vérifié dans Tailwind v4 : `translate-y-4` produit `translate: …` et `scale-95` produit
`scale: …` — des propriétés CSS **indépendantes**. GSAP, lui, écrit `transform:`. Le navigateur
applique les deux, elles se **cumulent** au lieu de s'écraser. Un élément qui garde une classe
`-translate-y-4` et reçoit un `y` de GSAP est décalé deux fois, silencieusement. Règle : sur un
élément animé, **l'état de transformation appartient à GSAP** ; pas d'utilitaire Tailwind
`translate-*`, `scale-*`, `rotate-*` dessus. L'état initial se pose avec `gsap.set()` ou un
`gsap.from()`.

**Le flash avant hydratation.**
Le HTML est rendu côté serveur, donc visible avant que le JS s'exécute. Un
`gsap.from(…, { opacity: 0 })` cache l'élément *après* qu'il a été peint : on voit le contenu,
puis il disparaît, puis il réapparaît. Poser l'état initial en CSS (`opacity-0` sur le
conteneur), puis animer avec `gsap.to()`. Corollaire : prévoir que sans JS, le contenu reste
lisible — ne jamais laisser une section définitivement invisible si l'animation ne part pas.

**Rafraîchir ScrollTrigger après le chargement des images.**
Les positions sont calculées à l'initialisation. Les images de l'API arrivent après et décalent
tout. `ScrollTrigger.refresh()` une fois les images chargées, et sur resize (le cours le fait
déjà, avec un debounce de 250ms dans `main.js`).

**`prefers-reduced-motion`.**
Non traité dans le cours, mais c'est un critère d'accessibilité et l'étape 8 de la roadmap y
passe. GSAP fournit `gsap.matchMedia()` :

```ts
const mm = gsap.matchMedia();
mm.add("(prefers-reduced-motion: no-preference)", () => {
  // animations ici ; automatiquement révoquées si la préférence change
});
```

**Ne pas empiler Lenis et ScrollSmoother.** Le plugin `ScrollSmoother` de GSAP fait le même
travail que Lenis. Les deux ensemble se battent pour le contrôle du scroll. Lenis est le choix
acté (§7), donc `ScrollSmoother` reste inutilisé même s'il est présent dans le package.

---

## 9. Checklist avant de committer une animation

- [ ] `"use client"` sur le composant d'animation, et sur lui seul
- [ ] `useGSAP` avec un `scope`, jamais `useEffect` + `querySelector`
- [ ] `contextSafe` pour toute animation déclenchée par un événement
- [ ] Aucune valeur en px : `yPercent` / `xPercent`, ou des rem
- [ ] Aucune classe Tailwind `translate-*` / `scale-*` / `rotate-*` sur l'élément animé
- [ ] Le contenu reste lisible si le JS ne part pas
- [ ] `markers: true` retiré
- [ ] `SplitText` derrière `document.fonts.ready`
- [ ] Testé en 1440 **et** en 1920+
