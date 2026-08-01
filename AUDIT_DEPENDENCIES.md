# Audit des dépendances — MushafPlus
**Date** : 2026-07-30 | **Outil** : npm audit + npm outdated | **Branche** : perf/load-times-and-bug-fixes

---

## 1. CVE et vulnérabilités

```
npm audit: found 0 vulnerabilities
```

**Aucune CVE active.** Le patch récent (`brace-expansion`) est déjà appliqué (commit `b59427c`).

---

## 2. Packages outdated

### Mises à jour patch/minor — sans breaking change, `npm install` suffit

| Package | Actuel | Voulu (semver) | Latest |
|---|---|---|---|
| vite | 8.0.16 | 8.1.5 | 8.1.5 |
| @vitejs/plugin-react | 6.0.2 | 6.0.5 | 6.0.5 |
| @tailwindcss/vite | 4.3.0 | 4.3.3 | 4.3.3 |
| tailwindcss | 4.3.0 | 4.3.3 | 4.3.3 |
| tailwind-merge | 3.5.0 | 3.6.0 | 3.6.0 |
| postcss | 8.5.19 | 8.5.25 | 8.5.25 |
| @radix-ui/react-dialog | 1.1.15 | 1.1.23 | 1.1.23 |
| @radix-ui/react-dropdown-menu | 2.1.16 | 2.1.24 | 2.1.24 |
| @radix-ui/react-popover | 1.1.15 | 1.1.23 | 1.1.23 |
| @radix-ui/react-slot | 1.2.4 | 1.3.3 | 1.3.3 |
| @radix-ui/react-tabs | 1.1.13 | 1.1.21 | 1.1.21 |
| @radix-ui/react-tooltip | 1.2.8 | 1.2.16 | 1.2.16 |
| @playwright/test + playwright | 1.59.1 | 1.62.0 | 1.62.0 |
| eslint | 10.7.0 | 10.8.0 | 10.8.0 |
| globals | 17.7.0 | 17.8.0 | 17.8.0 |

### Mises à jour MAJOR — breaking changes potentiels

| Package | Actuel | Latest | Risque |
|---|---|---|---|
| **react** + **react-dom** | 18.3.1 | **19.2.8** | Haut — React 19 supprime `ReactDOM.render`, certains patterns de Context changent, `ref` devient prop |
| **lucide-react** | 0.576.0 | **1.28.0** | Moyen — v1.0 a renommé/supprimé des icônes. Audit des noms d'icônes requis avant migration |
| **@types/react** + **@types/react-dom** | 18.3.x | **19.2.x** | Faible seul, mais doit suivre react@19 |

---

## 3. Poids bundle par dépendance (dist/assets analysé)

Build production du 2026-07-30 — tailles non compressées :

### JavaScript

| Chunk (hash) | Taille | Contenu identifié |
|---|---|---|
| CKkb6Zyx.js | **159 KB** | Chunk principal (app) |
| Buz8Mn2l2.js | **148 KB** | `displayClasses` / QuranDisplay |
| V-fMJQUW.js | **139 KB** | `vendor-react` (react + react-dom + scheduler) |
| DM9bEi6p.js | 69 KB | Chunk app |
| bZZ8sFa5.js | 69 KB | Chunk app |
| C_fyV1dH.js | 56 KB | Chunk app |
| D0eYGais2.js | 44 KB | Chunk app |
| hGyhBGFC.js | 41 KB | Chunk app |
| H-ZbLinP.js | 38 KB | Chunk app |
| 1ZjpunNd.js | 30 KB | `vendor-icons` (lucide-react) |
| BksUOlE6.js | 26 KB | Radix UI primitives |
| DQbRUPOS.js | 26 KB | Probable `vendor-crypto` (crypto-js) |

**Total JS estimé : ~900 KB non compressé** (~280 KB gzip estimé)

### CSS

| Fichier | Taille | Note |
|---|---|---|
| OlQ7oaqm.css | **395 KB** | CSS principal |
| BPzEtJAO.css | **179 KB** | Chunk CSS |
| CURc-uvi.css | **167 KB** | Chunk CSS |
| DnkRxovw.css | 59 KB | Chunk CSS |
| Dl334-VL.css | 46 KB | Chunk CSS |

**Total CSS : ~870 KB non compressé** — C'est le poste le plus lourd. PurgeCSS post-build est actif mais le résultat reste conséquent.

---

## 4. Dépendances potentiellement inutilisées ou redondantes

### `@fullhuman/postcss-purgecss` + `purgecss` — doublon probable

`purgecss` (CLI standalone) est utilisé par `scripts/purge-css.mjs` en post-build.
`@fullhuman/postcss-purgecss` (plugin PostCSS) n'a d'utilité que si une config `postcss.config.js` l'appelle. Vérifier si ce fichier existe — s'il n'y a pas de config PostCSS dédiée, `@fullhuman/postcss-purgecss` est inutilisé.

### `esbuild` en devDependency — probablement redondant

Vite 8 embarque déjà esbuild en dépendance interne. La présence explicite de `esbuild: ^0.28.1` en devDep est justifiée uniquement si des scripts l'appellent directement (`scripts/*.mjs`). Sinon, c'est redondant (Vite résoudra sa propre version interne).

### `@xmldom/xmldom`

Parser XML utilisé dans au moins un script d'audit (`scripts/verify-warsh-tajweed.mjs` ou équivalent). Dépendance de dev légitime si ces scripts tournent en CI.

---

## 5. Packages lourds — alternatives plus légères

| Package actuel | Taille bundle | Alternative | Gain estimé |
|---|---|---|---|
| **crypto-js** (~26 KB) | Librairie cryptographique complète | **Web Crypto API** (natif navigateur) | ~26 KB économisés. Pour du simple hashing/HMAC, `crypto.subtle` est disponible dans tous les navigateurs modernes (>= Chrome 37). Migration non triviale mais sans dépendance externe. |
| **lucide-react** (30 KB chunk) | Déjà tree-shaken via vite | Aucune action — le chunk à 30 KB est acceptable pour un jeu d'icônes complet. | — |
| Radix UI (6 packages) | ~26 KB Radix primitives | Pas d'alternative plus légère à parité fonctionnelle. Taille raisonnable. | — |

---

## 6. Résumé — tableau de bord

| Package | Version | Latest | Action | Urgence |
|---|---|---|---|---|
| vite | 8.0.16 | 8.1.5 | `npm update vite` | Faible |
| @vitejs/plugin-react | 6.0.2 | 6.0.5 | `npm update` | Faible |
| tailwindcss + @tailwindcss/vite | 4.3.0 | 4.3.3 | `npm update` | Faible |
| tailwind-merge | 3.5.0 | 3.6.0 | `npm update` | Faible |
| postcss | 8.5.19 | 8.5.25 | `npm update` | Faible |
| @radix-ui/* (6 packages) | 1.x / 2.x | patch | `npm update` | Faible |
| @playwright/test + playwright | 1.59.1 | 1.62.0 | `npm update` | Faible |
| eslint + globals | 10.7.0 | 10.8.0 | `npm update` | Faible |
| **lucide-react** | 0.576.0 | **1.28.0** | Audit des icônes → migration manuelle | **Moyen** |
| **react + react-dom** | 18.3.1 | **19.2.8** | Branch dédiée, tests e2e complets | **Haut (différer)** |
| **crypto-js** | 4.2.0 | 4.2.0 | Remplacer par Web Crypto API | Moyen (bundle) |
| @fullhuman/postcss-purgecss | 8.0.0 | 8.0.0 | Vérifier usage, supprimer si inactif | Faible |
| CSS bundle (~870 KB) | — | — | Investiguer les 3 gros CSS chunks | **Moyen** |

### Actions prioritaires

1. **`npm update`** — mettre à jour tous les packages minor/patch en une commande (aucun breaking change).
2. **CSS** — Le CSS non compressé à 870 KB est le vrai goulot. PurgeCSS tourne déjà, mais les 3 gros chunks (`OlQ7oaqm` 395 KB, `BPzEtJAO` 179 KB, `CURc-uvi` 167 KB) méritent analyse (CSS dupliqué entre chunks ?).
3. **crypto-js** — Migrer vers `crypto.subtle` (Web Crypto API) pour économiser ~26 KB JS et éliminer une dépendance externe.
4. **lucide-react v1** — Tester la migration sur une branche isolée : la v1.0 a supprimé/renommé plusieurs icônes.
5. **React 19** — Différer : migration non urgente, React 18 LTS reste supporté. Préparer une branche `feat/react-19` avec test e2e complet avant merge.
