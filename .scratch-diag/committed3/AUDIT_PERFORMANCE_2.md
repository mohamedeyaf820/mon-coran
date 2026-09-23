# AUDIT PERFORMANCE 2 — MushafPlus
> Date : 2026-07-30 | Branch : `perf/load-times-and-bug-fixes`

---

## 1. Métriques actuelles vs référence initiale

| Métrique | Référence initiale | Objectif | Actuel | Statut |
|---|---|---|---|---|
| **JS total** | 1 450 kB | ≤ 1 275 kB | **1 244.7 kB** | ✅ -205 kB (-14.2%) |
| **CSS total** | 880+ kB | ≤ 907 kB | **789.1 kB** | ✅ -91 kB (-10.3%) |
| **Initial JS** (entry + preloads) | 378 kB | ≤ 418 kB | **396.7 kB** | ✅ +18.7 kB mais sous le plafond |
| **Initial CSS** (B-nkpCnH.css) | — | ≤ 395 kB | **363.8 kB** | ✅ sous le plafond |
| **Initial combiné** | — | — | **760.5 kB** (gzip ~190 kB) | ✅ |
| **Logo.png** | 1.8 MB | Supprimé | **Absent** (D public/logo.png) | ✅ supprimé |
| **SplashScreen durée max** | 700 ms | ≤ 450 ms | **400 ms** (t2 = 400 ms) | ✅ -300 ms |
| **Micro-chunks JS** (<5 kB) | 30+ | ≤ 15 | **29 fichiers** (60.6 kB) | 🔴 encore ×2 l'objectif |
| **Nombre total de chunks JS** | — | — | **69 fichiers** | 🔴 très fragmenté |
| **Nombre total de chunks CSS** | — | — | **11 fichiers** | 🟡 acceptable |
| **Deferred CSS** | absent | en place | **requestIdleCallback + interaction** | ✅ |
| **DNS prefetch / preconnect** | absent | en place | **9 domaines** | ✅ |
| **Preload logo-ui.webp** | absent | en place | **fetchpriority="high"** | ✅ |
| **Preload font sura_names.woff2** | absent | en place | **crossorigin** | ✅ |
| **Logo-512.png** | — | WebP | **106 kB PNG** | 🟡 non converti |
| **Logo-192.png** | — | — | **18 kB** | ✅ optimisé |

---

## 2. Statut de chaque optimisation

### Bundle JS
| Optimisation | Statut | Détail |
|---|---|---|
| Réduction JS total sous 1 275 kB | ✅ | 1 244.7 kB, −205 kB vs référence |
| Initial JS sous 418 kB | ✅ | 396.7 kB (entry 158 kB + 5 preloads) |
| Lazy loading (code splitting) | ✅ | 26 `lazy()` dans App.jsx |
| Vendor chunks React | ✅ | `vendor-react` group configuré |
| Vendor chunk crypto-js | ✅ | `vendor-crypto` group configuré |
| Vendor chunk idb | ✅ | `vendor-storage` group configuré |
| Lucide-react chunking | 🟡 | maxSize 160 kB → chunk Bj0Zt1mP.js = 66.6 kB (correct mais pas tree-shaké) |
| Micro-chunks < 5 kB réduits à ≤ 15 | 🔴 | 29 fichiers micro encore présents (60.6 kB perdus en HTTP overhead) |
| minSize configuré pour éviter micro-chunks | 🔴 | `codeSplitting.groups` sans `minSize` global → Vite génère des chunks < 1 kB |
| console/debugger drop en prod | ✅ | `dropConsole: true, dropDebugger: true` dans esbuild |
| sourcemap désactivé | ✅ | `sourcemap: false` |

### Bundle CSS
| Optimisation | Statut | Détail |
|---|---|---|
| CSS total sous 907 kB | ✅ | 789.1 kB, −91 kB vs référence |
| CSS code split activé | ✅ | `cssCodeSplit: true` |
| CSS minification esbuild | ✅ | `cssMinify: "esbuild"` |
| Deferred CSS (non-critique différé) | ✅ | `deferredStyles.js` via `requestIdleCallback`/interaction |
| CSS home séparé | ✅ | 55.2 kB (budget 58 kB) ✅ |
| CSS reader séparé | ✅ | 107.6 kB (budget 180 kB) ✅ |
| CSS principal B-nkpCnH.css | 🟡 | 363.8 kB — toujours le chunk critique, gzip ~110 kB estimé |
| Tailwind v4 purge | 🟡 | 363 kB suggère du CSS non utilisé (homepage) dans le bundle critique |

### Images & Assets
| Optimisation | Statut | Détail |
|---|---|---|
| logo.png 1.8 MB supprimé | ✅ | `D public/logo.png` dans git status |
| logo-ui.webp préchargé | ✅ | `<link rel="preload" fetchpriority="high">` |
| logo-192.png | ✅ | 18.2 kB — optimisé |
| logo-192-maskable.png | ✅ | 19.4 kB — acceptable |
| logo-512.png / logo-512-maskable.png | 🟡 | 103–106 kB chacun — WebP réduirait à ~30 kB |
| OG image webp | 🟡 | og-image.jpg référencé mais non audité |

### SplashScreen & Runtime
| Optimisation | Statut | Détail |
|---|---|---|
| SplashScreen ≤ 450 ms | ✅ | Limite dure `t2 = 400 ms`, lowPerfMode = 280 ms |
| Bouton Skip après 250 ms | ✅ | `setTimeout(..., 250)` |
| Prefetch au démarrage | ✅ | `onPrefetch` prop → early dismiss si données prêtes |
| SW cache (300 entrées max) | ✅ | `[CACHE_NAME]: 300` |
| Chunk recovery auto (ChunkLoadError) | ✅ | Reload automatique avec clearMushafRuntimeCaches |

### HTML / Réseau
| Optimisation | Statut | Détail |
|---|---|---|
| `<link rel="preconnect">` API primaire | ✅ | `api.quran.com` avec crossorigin |
| DNS prefetch domaines secondaires | ✅ | 8 domaines audio/CDN |
| modulepreload chunks critiques | ✅ | 5 chunks préchargés au démarrage |
| Preload font sura_names.woff2 | ✅ | crossorigin |
| CSP stricte | ✅ | Pas de `unsafe-eval`, `object-src: none` |
| Pas de frame-ancestors dans meta | ✅ | Filtré, appliqué uniquement en HTTP header |
| `reportCompressedSize: true` | ✅ | gzip visible dans le build log |

---

## 3. Score performance global

```
JS total budget          ✅  15 / 15
CSS total budget         ✅  15 / 15
Initial JS budget        ✅  12 / 15  (légère hausse vs référence mais sous plafond)
SplashScreen timing      ✅  10 / 10
Logo.png supprimé        ✅  10 / 10
Deferred CSS             ✅   8 / 10  (en place, CSS critique encore lourd)
Preloads/prefetch        ✅   8 / 10  (bonne couverture, manque preconnect gstatic)
Micro-chunks             🔴   2 / 10  (29/15 objectif, double du budget)
Images WebP              🟡   4 /  5  (logo-512 PNG restant)
SW & récupération        ✅   5 /  5
Minification/tree-shake  ✅   4 /  5
```

**Score total : 93 / 110 → 85 / 100**

---

## 4. Top 5 Quick Wins restants

### #1 — Consolider les micro-chunks JS
**Effort :** 1h | **Impact :** −29 HTTP requests, −~20 ms parse overhead mobile

Dans `vite.config.js`, ajouter `minSize` global au niveau `output` pour empêcher Vite de générer des chunks < 8 kB :

```js
// Dans rollupOptions.output :
experimentalMinChunkSize: 8 * 1024,   // Vite 8+ (ou minSize selon la version)
```

Les 29 micro-chunks (60.6 kB cumulés, 0.1–5 kB chacun) génèrent des requêtes HTTP inutiles et augmentent le temps de parsing. Le gain réseau est modéré mais le gain de robustesse réseau (moins de round-trips) est significatif sur 3G.

---

### #2 — Convertir logo-512.png en WebP
**Effort :** 30 min | **Impact :** −140 kB sur le premier install PWA (manifest)

`logo-512.png` (106 kB) et `logo-512-maskable.png` (103 kB) sont référencés dans `manifest.json`. Une conversion WebP les réduirait à ~30 kB chacun (−75%). Ces images sont téléchargées lors de l'installation PWA et mises en cache par le SW.

```bash
cwebp -q 85 public/logo-512.png -o public/logo-512.webp
cwebp -q 85 public/logo-512-maskable.png -o public/logo-512-maskable.webp
```

Puis mettre à jour `public/manifest.json` avec `"type": "image/webp"`.

---

### #3 — Réduire le CSS critique (B-nkpCnH.css, 363.8 kB)
**Effort :** 2–3h | **Impact :** −30 à −80 kB sur l'initial CSS, −50–150 ms LCP mobile

Le bundle CSS principal inclut probablement des règles Tailwind pour des composants chargés paresseusement (QuranDisplay, AudioPlayer, etc.). Auditer avec PurgeCSS ou le rapport Tailwind v4 pour identifier les classes non utilisées côté homepage. Vérifier si `src/styles/riwaya-fonts.css` (fonts conditionnelles) peut être déplacé dans `deferredStyles.js`.

---

### #4 — Ajouter `preconnect` pour fonts.gstatic.com
**Effort :** 5 min | **Impact :** −100–200 ms sur le premier rendu des polices Google

Le CSP autorise `https://fonts.gstatic.com` mais il n'y a aucun `preconnect` ni `dns-prefetch`. Ajouter dans `index.html` :

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
```

---

### #5 — Réduire la fragmentation CSS (11 → 6–7 fichiers)
**Effort :** 1h | **Impact :** −4–5 requêtes CSS, meilleure compression inter-chunks

Les 11 fichiers CSS contiennent plusieurs petits chunks (BZpF4tET.css = 5.9 kB, CRU1Q4sr.css = 4.8 kB, DysJp7Rc.css = 12 kB). Fusionner les CSS liés à un même domaine fonctionnel dans les lazy routes correspondantes réduirait les requêtes CSS parallèles et améliorerait la compression gzip (meilleure déduplication de séquences CSS similaires).

---

## 5. Résumé exécutif

Toutes les métriques de budget sont **dans les objectifs** : JS total, CSS total, Initial JS, SplashScreen, logo.png. La réduction de −205 kB de JS et −91 kB de CSS est significative. Le seul objectif non atteint est la consolidation des micro-chunks (29 fichiers < 5 kB au lieu de ≤ 15), corrigeable en 1h dans `vite.config.js`. Les gains restants sont des améliorations incrémentales (WebP logos, CSS critique, preconnect fonts) avec un bon ratio effort/impact.

---

*Généré le 2026-07-30 — branch `perf/load-times-and-bug-fixes`*
