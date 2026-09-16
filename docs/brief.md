# Sujet — M2 DEV · Projet Musée

> Recopie du sujet Notion fourni par l'école. Source de vérité pour l'évaluation.
> Ne pas modifier ce fichier : les interprétations et décisions vivent dans `CLAUDE.md`.

## Introduction

Coder un site de musée sous Next.js en se basant sur l'API publique du Metropolitan Museum
of Art :

- Création en autonomie d'un site entier sous Next.js
- Défis techniques pour apprendre les talents / limites du framework
- Utilisation de divers outils facilitateurs
- Mise en place de process créatifs

## Brief

Une API d'œuvres d'art est mise à disposition. Le but : s'en servir pour créer un site qui
donne envie de se cultiver. Prendre des décisions logiques et s'y tenir pour créer une
architecture technique solide. Laisser parler sa créativité, mais surtout s'assurer que le
site soit utilisable. Le projet confronte à différentes contraintes qu'on retrouve sur
n'importe quel site, et demande de réfléchir à la meilleure approche au sein de Next.js.

Ensuite, mettre en place de la créa au sein de Next.js (GSAP, transitions de pages,
composants optimisés) et montrer son esprit de logique face à un framework qui favorise
l'approche composants.

## Modalités

- Projet individuel
- Possibilité de demander au prof de checker tout et n'importe quoi
- Possibilité d'organiser des points en groupe avec toute la classe

## Objectifs concrets

- Utiliser les composants Next.js (`Image`, `Link`…) à bon escient
- Créer des composants réutilisables, tantôt server tantôt client
- Créer un système de routing interne logique
- Mettre en place un référencement efficace
- Mettre en place de l'interactivité accrue avec l'utilisateur
- Mettre en pratique les différents types de rendering de Next.js
- Comprendre l'intérêt des frameworks JS mais aussi leurs limites

## Features attendues

- **Header / Footer**
  - Barre de recherche en temps réel (header, autocomplete optionnel, actualisation des résultats)
- **Page d'accueil**
  - Hero
  - Sélections de tableaux
  - À propos
- **Tableaux**
  - Hero
  - Liste de tous les tableaux
  - Filtres actifs afin de trier les tableaux selon certains critères
- **Tableau**
  - Single page d'une œuvre qui recoupe toutes ses données
  - Redirection vers des tableaux similaires
- **Billetterie**
  - Page avec divers tarifs et un sidebar « total » qui s'actualise à chaque billet ajouté
    et à chaque option sélectionnée

### Grille tarifaire

| Tarif | Prix |
|---|---|
| Entrée adulte | 24 € |
| Entrée −12 ans | 12 € |
| Entrée jeune 12-25 | 18 € |
| Entrée personne en recherche d'emploi | 18 € |
| Entrée PMR | 18 € |
| Entrée senior | 18 € |
| Moins de 5 ans | Gratuit |
| Tarif groupe (+ 10 personnes) | 15 € / personne |
| Audioguide | 2 € / personne |
| Guide papier | 4 € / personne |
| Plan du musée | Gratuit, fourni à l'accueil |

## Animations attendues

- Une transition de page
- Un composant (wrapper ou non) qui permet d'appliquer une même animation à plusieurs
  éléments du site (text reveal, parallax…)
- Une animation d'arrivée sur au moins une page (single tableau, accueil…) : text reveal,
  image reveal ou autre
- Un preloader (utiliser le `isFirstRender` de Zustand)

## Livrables

- Application web fonctionnelle **déployée sur Vercel**
- Code source complet sur un **repo git**
- **Compte-rendu écrit** de retours critiques (positifs comme négatifs) de Next.js

## Outils pratiques suggérés

- Bonnes pratiques de commits
- Outil pour lire du code HTML dans une string
- Scroll smoother compatible avec Next.js
- Custom cursor de Cuberto avec option de mouse follow

## Pour approfondir

API Museum · store global · types de rendering (SSR, SSG, ISR) · page router → app router ·
conventions de nommage Next.js · `params` / `searchParams` · GSAP wrapper · TransitionLink ·
page transition · bases de GSAP · système de filtres dans Next.js

## Inspirations front

- Codrops — https://tympanus.net/codrops/
- Codegrid — https://www.youtube.com/@codegrid
- Olivier Larose — https://www.youtube.com/@olivierlarose1
