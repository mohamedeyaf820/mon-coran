# Rapport d'audit performance — MushafPlus
**Date :** 30 juillet 2026 | **Build mesuré :** production `dist/` post-purge-css  
**Méthode :** `npm run build:ci` + waterfall Playwright (vite preview port 4173) + budget script

---

## 1. Métriques de chargement (mesures réelles)

| Métrique | Valeur mesurée | Commentaire |
|----------|----------------|-------------|
| **DOMContentLoaded** | ~371 ms | Local, sans latence réseau |
| **Temps d'interactivité (idle+2s)** | ~1878 ms | Splash auto-dismiss à ~700 ms |
| **Requêtes HTTP totales** | **69 requêtes** | Première visite (sans SW) |
| **Poids total transféré** | **1492 kB** (~1.5 MB) | Énorme pour mobile 4G |
| **JS total chargé** | **667 kB** (60 fichiers) | Dont ~378 kB initial |
| **CSS total chargé** | **630 kB** (5 fichiers) | Dont 386 kB initial |
| **Polices chargées** | **164 kB** (2 fichiers) | sura_names + Scheherazade |
| **Images chargées** | **26 kB** | logo-ui.webp (preloaded) |

> **Remarque :** Les chiffres ci-dessus sont mesurés en local (0ms latence réseau, pas de compression HTTP). En production Netlify avec un bon CDN, les valeurs gzip réelles sont divisées par ~3 sur le réseau.

---

## 2. Budget bundle — Statut CI

| Limite | Valeur | Budget | Statut |
|--------|--------|--------|--------|
| CSS total agrégé | 891.9 kB | 907 kB | ✅ |
| JS total agrégé | 1232.2 kB | 1275 kB | ✅ |
| CSS+JS total | 2124.1 kB | 2175 kB | ✅ |
| **Initial JS** | **378.1 kB** | **418 kB** | ✅ (marges 40 kB) |
| **Initial CSS** | **386.1 kB** | **395 kB** | ✅ (marges 9 kB) |
| **Initial CSS+JS** | **764.2 kB** | **810 kB** | ✅ |
| **Initial gzip** | **187.8 kB** | **200 kB** | ✅ (marges 12 kB) |
| Largest JS chunk | 204.4 kB | 225 kB | ✅ |
| Largest CSS chunk | 386.1 kB | 395 kB | ✅ |
| Deferred CSS | 174.9 kB | 185 kB | ✅ |
| Home CSS | 57.9 kB | 58 kB | ✅ (~0.1 kB de marge!) |
| Reader CSS | 163.3 kB | 180 kB | ✅ |

**Tous les budgets CI passent.** Les marges restantes sont cependant très étroites (home CSS : 0.1 kB, initial gzip : 12 kB). Un ajout CSS de 1% dans la home pourrait casser le CI.

---

## 3. Décomposition du bundle initial

### JS Initial (378 kB raw / ~180 kB gzip)

| Chunk | Taille raw | Taille gzip | Contenu |
|-------|-----------|-------------|---------|
| `C0Em_vu0.js` (entry) | 158.8 kB | 49.8 kB | main.jsx + App.jsx + AppContext |
| `BKXG3ldN.js` (vendor) | 147.1 kB | 48.1 kB | React + ReactDOM + dépendances |
| `DM9bEi6p.js` (vendor) | 67.9 kB | 23.5 kB | Radix UI (eagerly imported) |
| `Dgu9dRys.js` | 3.3 kB | 1.3 kB | Micro utilitaires |
| `aKtaBQYM.js` | 1.1 kB | 0.6 kB | Manifest loader |
| **TOTAL** | **378.2 kB** | **123.3 kB** | |

### CSS Initial (386 kB raw / ~66 kB gzip)

Le fichier `DijnVK4d.css` (386 kB) est le bundle principal, produit de la fusion de tous les CSS critiques :
- `tailwind.css` : 462 kB source → 39.1% purgé → 386 kB produit
- `dark-mode-refonte.css`, `themes4.css`, `mobile-all-versions.css`, etc.

### Lazy chunks (chargés à la demande)

| Composant | Taille |
|-----------|--------|
| QuranDisplay | 204.4 kB |
| vendor-crypto (idb/crypto-js) | 162.6 kB |
| BKXG3ldN.js (react+vendor) | 150.6 kB |
| DGmwVsfa.js (HomePage) | 73.9 kB |
| DM9bEi6p.js | 69.5 kB |
| CD7XjHKm2.js (AudioPlayer) | 58.2 kB |
| CW_-CZAl.js (DuasPage) | 41.9 kB |
| DhrSz_BA.js (FutureFeaturesModal) | 39.3 kB |

---

## 4. Problèmes identifiés — par priorité

---

### 🔴 CRITIQUE

#### P1 — 60 fichiers JS chargés en première visite (cible : ≤15)

**Mesure :** 60 requêtes JS lors du chargement initial, dont seulement 5 sont "initial" (modulepreload), mais 55 autres sont déclenchés lors du render du SplashScreen → App → lazyComponents.

**Cause :** Vite génère un chunk par composant lazy. Avec 30+ composants lazy dans App.jsx, cela crée 30+ mini-chunks (~0.2-1.5 kB chacun) chargés en cascade dès que l'arbre React commence à rendre.

**Impact :** 30 requêtes HTTP × 2 RTT (établissement connexion) = +60-120 ms sur mobile 4G.

**Solution :** Grouper les composants rarement utilisés en chunks thématiques :
```js
// Au lieu de 30 lazy() séparés, regrouper les panneaux "outils" :
const ToolsPanels = lazy(() => import("./components/ToolsPanels")); // réexporte WirdPanel, KhatmaPanel, FlashcardsPanel, etc.
```

---

#### P2 — `logo.png` de 1.8 MB dans `/public`

**Mesure :** `public/logo.png` = 1855 kB. N'est pas servi au navigateur (non référencé en HTML), mais est copié dans `dist/` à chaque build et donc dans le déploiement Netlify.

**Impact :** +1.8 MB de storage Netlify inutile. Si quelqu'un accède directement à `/logo.png` (via partage social, outil de scraping), il télécharge 1.8 MB.

**Solution :** 
1. Remplacer par `logo-512.png` (408 kB) là où logo.png est référencé (manifest.json? - actuellement aucune référence)
2. Supprimer `public/logo.png` si complètement inutilisé

---

#### P3 — CSS source total : 1490 kB avec 6737 `!important`

**Mesure :**
- CSS source total : 1490 kB (31 fichiers)
- `!important` total : **6737** occurrences
- Top 3 : `home-audio-ux-refonte.css` (1407 !imp/113 kB), `reading-platform.css` (1006 !imp/146 kB), `reader-consolidation.css` (684 !imp/102 kB)

**Impact :**
- L'utilisation massive de `!important` empêche toute surcharge sans ajouter d'autres `!important`. C'est un multiplicateur de CSS — chaque nouveau composant ajoute 20-50 `!important` supplémentaires pour override les styles existants, gonflant le CSS indéfiniment.
- Le parseur CSS du navigateur doit évaluer tous les `!important` en cascade → micro-latence sur les appareils bas de gamme.
- La purge CSS est moins efficace (les règles importantes sont retenues même si le sélecteur est rarement utilisé).

**Solution à long terme :** Refactoring architectural : utiliser des CSS Modules, Tailwind utility-first strict, ou une architecture BEM avec spécificité basse. Objectif ≤ 500 `!important` total.

**Quick wins :** Cibler les 3 fichiers les plus chargés en priorité.

---

### 🟠 IMPORTANT

#### P4 — Polices Quraniques chargées depuis CDN externe (latence + SPOF)

**Mesure :** `tailwind.css` contient des `@font-face` pointant vers :
- `https://fonts.quranwbw.com/v2/kfgqpc_uthman_taha_warsh-webfont.woff2`
- `https://static-cdn.tarteel.ai/qul/fonts/nastaleeq/KFGQPCNastaleeq-Regular.ttf`

**Impact :**
- Si ces CDNs sont lents ou indisponibles → police de fallback (Scheherazade/serif) → FOUT (Flash of Unstyled Text) sur Warsh
- Le navigateur fait un DNS lookup + TCP + TLS + GET pour chaque police → +200-800 ms par police
- Le `.ttf` Nastaleeq n'est pas compressé (woff2 serait 40-60% plus léger)

**Solution :**
1. Self-host les fonts QPC Warsh et Nastaleeq dans `public/fonts/` (comme Scheherazade)
2. Ajouter `<link rel="preload">` dans `index.html` pour les polices critiques
3. Convertir le `.ttf` Nastaleeq en `.woff2`

---

#### P5 — Marges CSS budget quasi-nulles (home CSS : 0.1 kB)

**Mesure :** `home CSS: 57.9 kB (limit 58 kB)` → marge de 100 octets

**Impact :** Le moindre ajout CSS dans la page d'accueil (nouveau widget, hover state) casse le CI.

**Solution :** 
- Option A : Augmenter le budget `BUDGET_HOME_CSS_KB` de 58 → 65 kB avec justification
- Option B : Auditer et supprimer du CSS inutilisé spécifique à la home

---

#### P6 — `search-home-polish.css` : 110 kB de source pour la page d'accueil et recherche

**Mesure :** Après purge, ce fichier est réduit à 57.9 kB dans le chunk home. La source fait 110 kB.

**Impact :** 50 kB purgés = 50 kB de CSS mort en développement → développeurs voient 110 kB de CSS dont la moitié n'est jamais appliquée.

**Solution :** Supprimer ou consolider les règles mortes dans ce fichier (cible : 40-50 kB source).

---

#### P7 — QuranDisplay : 204 kB en un seul chunk lazy

**Mesure :** `CY0-OkbV.js` = 204.4 kB raw / 56.7 kB gzip

**Impact :** L'utilisateur attend ce chunk entier avant de voir le premier verset. Sur 3G lent (1 Mbps), 57 kB gzip = ~450 ms de téléchargement supplémentaire.

**Solution :** Split interne au composant :
- `SurahMode` (lecture liste) chargé immédiatement
- `PageMode` (Mushaf) chargé on-demand si l'utilisateur clique sur "Mushaf"
- `JuzMode` chargé on-demand si l'utilisateur clique sur "Juz"
- Économie estimée : -30 à -50 kB du chunk initial de QuranDisplay

---

#### P8 — AppContext : 899 lignes, 11 `useEffect`, montre des signes d'inflation

**Mesure :** `src/context/AppContext.jsx` = 899 lignes, 11 useEffect, 0 useState (tout via useReducer).

**Impact :**
- Tout composant consommateur est re-rendu à chaque dispatch, même si la partie de state qui l'intéresse n'a pas changé
- Le `useAppSelector` est en place pour mitiger ça, mais 63 composants utilisent encore `useEffect`/`useState` directement
- Les 11 useEffect dans AppContext s'exécutent séquentiellement au mount → augmente le TTI

**Solution :**
- Valider que tous les consommateurs utilisent `useAppSelector` et non `useApp()` directement
- Découper AppContext en sous-contextes : `AudioContext`, `PreferencesContext`, `ReaderContext`
- Bénéfice : réduction de ~60% des re-renders non nécessaires

---

### 🟡 MODÉRÉ

#### P9 — Splash Screen : délai résiduel de 300-700 ms

**Mesure :** `SplashScreen.jsx` a des timers de 300 ms (fadeOut) + 500 ms (dismiss) + 400 ms (onDone) = bloque le rendu de l'app pendant 700 ms à 1 seconde.

**Contexte :** Ce délai a déjà été réduit dans une session précédente (de 1300 ms à 700 ms). Il reste non nul.

**Impact :** Sur un réseau rapide avec SW cache-first, la home pourrait être visible en <200 ms. Le splash artificiel ajoute 700 ms.

**Solution :** Réduire les timers : fadeOut à 150 ms, dismiss à 300 ms. Total : 450 ms.
Ou : rendre le splash optionnel après la première visite (ne l'afficher qu'au premier chargement, pas à chaque navigation).

---

#### P10 — Aucune Image de Recitateur en format WebP

**Mesure :** Les images de récitateurs viennent de `https://cdn.islamic.network`. Ce CDN sert des JPG.

**Impact :** Sur la page récitation et le profil récitateur, ~15-20 images JPG sont chargées. Un JPG récitateur moyen = 15-50 kB. WebP serait 25-35% plus léger.

**Solution :** Utiliser l'API CDN qui peut servir du WebP via `Accept: image/webp` header, ou utiliser les URLs avec paramètre format si disponible.

---

#### P11 — Pas de compression HTTP serveur configurée pour Netlify

**Mesure :** `netlify.toml` ne contient aucune configuration de compression (gzip/brotli).

**Impact :** Netlify active la compression automatiquement pour les assets statiques, mais pas forcément pour les JSON de l'API quranwbw ou les réponses API Quran.com.

**Vérification :** Confirmer que les entêtes `Content-Encoding: br` ou `gzip` sont présents sur tous les assets en production.

---

#### P12 — Service Worker : cache limite à 180 ressources

**Mesure :** `CACHE_LIMITS = { [CACHE_NAME]: 180, [API_CACHE_NAME]: 160 }`

**Impact :** Avec 69 ressources chargées sur la première page seule, et ~50 autres pour le lecteur, on atteint rapidement les 180 entrées. Les anciennes entrées sont évincées → miss-cache → re-téléchargement → dégradation hors-ligne.

**Solution :** Augmenter à 300 ressources pour le cache principal, ou basculer sur une stratégie par taille totale (LRU avec max 30 MB) plutôt que par nombre.

---

#### P13 — 108 chunks JS au total (dont 55+ micro-chunks <2 kB)

**Mesure :** `ls dist/assets/*.js | wc -l` = 108 fichiers JS.

**Impact :** 50+ fichiers JS de 100-500 octets chacun. HTTP/2 les parallélise bien, mais chaque requête a un overhead de headers (~200 octets). Sur HTTP/1.1 (réseau lent/proxy), c'est 50 connexions en série.

**Solution :** Ajuster le `rollupOptions.output.experimentalMinChunkSize` dans vite.config.js :
```js
// Dans rollupOptions.output:
experimentalMinChunkSize: 2000, // fusionner les chunks < 2kB
```
Réduction estimée : de 108 à ~60-70 chunks.

---

#### P14 — Polices Scheherazade New : 164 kB toujours chargées en premier (bloquant)

**Mesure :** `scheherazade-new-400.woff2` (77.4 kB) + `scheherazade-new-700.woff2` (87.4 kB) chargées au premier rendu.

**Impact :** Ces polices sont utilisées pour le fallback Quran et le texte arabe. Elles bloquent la peinture des versets pendant ~150-300 ms sur réseau moyen.

**Améliorations :**
1. `font-display: swap` est-il bien en place ? (à vérifier dans riwaya-fonts.css)
2. Subsetting : Scheherazade New contient des caractères pour de nombreux scripts. Un subset limité à l'arabe + ponctuation arabe réduirait la taille de 40-60%.

---

### 🟢 MINEUR

#### P15 — `pwa-home-wide.png` : 559 kB pour une image PWA screenshot

Les screenshots PWA (`pwa-home-wide.png`, `pwa-home-mobile.png`) sont dans `/public` et déployés dans `dist/`. Ils ne sont jamais chargés par le navigateur lors de la navigation normale, uniquement lors de l'install PWA. La taille n'impacte pas le TTI mais contribue inutilement à la bande passante.

**Solution :** Compresser avec pngquant/squoosh (cible : -60% = ~220 kB).

#### P16 — `audio-legacy.css` : 31.5 kB potentiellement mort

**Mesure :** `src/styles/audio-legacy.css` = 31.5 kB source. Ce fichier est-il encore importé ?

**Vérification :**
```bash
grep -r "audio-legacy" src/
```

#### P17 — `font-display: swap` non vérifié sur @font-face CDN

Les `@font-face` dans `tailwind.css` pointant vers des CDNs externes n'ont peut-être pas `font-display: swap`, provoquant un FOIT (Flash of Invisible Text) pendant le chargement de la police.

---

## 5. Architecture CSS — Diagnostic approfondi

### Situation actuelle (source)

| Fichier | Taille source | `!important` | Statut |
|---------|--------------|-------------|--------|
| `tailwind.css` | 462 kB | 313 | Base design system |
| `reading-platform.css` | 146 kB | 1006 | 🔴 CSS dette majeure |
| `home-audio-ux-refonte.css` | 114 kB | 1407 | 🔴 CSS dette majeure |
| `search-home-polish.css` | 110 kB | 350 | 🟠 Redondant avec tailwind |
| `reader-consolidation.css` | 102 kB | 684 | 🔴 CSS dette majeure |
| `responsive-all.css` | 74 kB | 669 | 🟠 À découper par route |
| `premium-plus.css` | 57 kB | ? | Déféré |
| `themes4.css` | 50 kB | 163 | Partiellement OK |
| `mobile-all-versions.css` | 49 kB | ? | Initial — lourd |
| **TOTAL** | **1490 kB** | **6737** | |

### CSS par phase de chargement

| Phase | Fichiers | Taille source | Taille dist |
|-------|---------|--------------|-------------|
| **Critique (initial)** | tailwind + themes4 + dark-mode + header + mobile-all + device-root + ui-polish + riwaya | ~621 kB source | **386 kB dist** (purge 38%) |
| **Déféré (on interaction)** | responsive-all + premium-platform + premium-plus + expert-overhaul + home-audio + device-responsive | ~290 kB source | **175 kB dist** (purge 40%) |
| **Route home** | search-home-polish + partie homepage | ~140 kB source | **58 kB dist** (purge 59%) |
| **Route reader** | reading-platform + reader-consolidation | ~248 kB source | **163 kB dist** (purge 34%) |

---

## 6. Optimisations réseau — Waterfall

### Problèmes de séquençage

```
0ms   → HTML (5.6 kB)
       → modulepreload JS x4 (parallel)
       → stylesheet CSS x1 (386 kB — render-blocking)
10ms  → boot-recovery.js (2.7 kB)
       → logo-ui.webp (26 kB — preloaded)
       → sura_names.woff2 (86.5 kB — preloaded)
       → scheherazade-new-400.woff2 (77.4 kB — preloaded)
~50ms → React hydrate → Lazy components triggered
       → 55 micro-chunks en cascade (0.1-5 kB chacun)
       → Deferred CSS (174.9 kB) at idle
```

**Point critique :** Le CSS initial (386 kB) est **render-blocking**. Le navigateur ne peut pas peindre avant d'avoir parsé ce fichier entier, même si 39% des règles ne s'appliquent pas à la page courante.

**Amélioration possible :** Extraire le CSS "above-the-fold" dans un `<style>` inline critique (< 14 kB) et charger le reste via `<link rel="preload">` non-bloquant. Impact estimé : -100 à -200 ms sur FCP.

### Points bien faits ✅
- `sura_names.woff2` et `logo-ui.webp` ont des `<link rel="preload">` → chargement en parallèle du HTML
- `dns-prefetch` pour les CDNs audio configurés
- `modulepreload` pour les 4 chunks JS initiaux

---

## 7. Service Worker — Analyse

| Aspect | Mesure | Évaluation |
|--------|--------|-----------|
| Taille SW | 16.5 kB | Raisonnable |
| Stratégie JS/CSS | Cache-First | ✅ Optimal pour assets hashés |
| Stratégie API | Stale-While-Revalidate | ✅ |
| Stratégie HTML | Network-First + fallback | ✅ |
| Cache limit JS/CSS | 180 ressources | 🟡 Trop faible |
| Précache app shell | Oui (index.html + SW + boot) | ✅ |
| Réponses opaques cachées | Oui (`response.type === "opaque"`) | 🔴 À corriger |
| Offline page | Oui (multilingue) | ✅ |
| Mise à jour SW | Via `skipWaiting` + message | ✅ |

---

## 8. Récapitulatif des améliorations prioritaires

| Priorité | ID | Impact estimé | Effort | Description |
|----------|----|--------------|--------|-------------|
| 🔴 Critique | P3 | -200 kB CSS / meilleure maintenabilité | Élevé | Réduire les 6737 `!important` dans les 3 fichiers CSS principaux |
| 🔴 Critique | P2 | -1.8 MB en déploiement | Très faible | Supprimer `public/logo.png` inutilisé |
| 🟠 Important | P1 | -30 à -60 ms TTI | Moyen | Regrouper les 30 composants lazy en 5-7 chunks thématiques |
| 🟠 Important | P4 | -200-800 ms (FOUT Warsh) | Moyen | Self-host QPC Warsh font → `public/fonts/` |
| 🟠 Important | P7 | -30 à -50 kB initial QuranDisplay | Moyen | Split interne QuranDisplay (SurahMode eager, PageMode/JuzMode lazy) |
| 🟠 Important | P5 | CI résilience | Très faible | Augmenter `BUDGET_HOME_CSS_KB` de 58 → 65 kB |
| 🟡 Modéré | P9 | -250 ms TTI | Faible | Réduire timers SplashScreen de 700 ms → 450 ms |
| 🟡 Modéré | P13 | -50 requêtes HTTP | Faible | `experimentalMinChunkSize: 2000` dans vite.config.js |
| 🟡 Modéré | P12 | Meilleure résistance offline | Faible | Augmenter cache SW de 180 → 300 ressources |
| 🟡 Modéré | P14 | -40-60 kB polices | Moyen | Subsetting Scheherazade New (arabe uniquement) |
| 🟡 Modéré | P8 | -60% re-renders | Élevé | Découper AppContext en sous-contextes |
| 🟢 Mineur | P15 | -340 kB PWA assets | Très faible | Compresser pwa-home-wide.png et pwa-home-mobile.png |
| 🟢 Mineur | P16 | -31.5 kB si mort | Très faible | Vérifier si audio-legacy.css est encore importé |
| 🟢 Mineur | P17 | Éliminer FOIT | Très faible | Ajouter `font-display: swap` aux @font-face CDN |

---

## 9. Métriques Lighthouse estimées (sur réseau 4G standard)

Basé sur les mesures locales et les données de la waterfall :

| Métrique | Estimé actuel | Cible après corrections |
|----------|--------------|------------------------|
| **FCP (First Contentful Paint)** | ~600-900 ms | ~400-600 ms |
| **LCP (Largest Contentful Paint)** | ~1500-2500 ms | ~800-1200 ms |
| **TTI (Time To Interactive)** | ~2000-3000 ms | ~1200-1800 ms |
| **TBT (Total Blocking Time)** | ~100-300 ms | ~50-100 ms |
| **CLS (Cumulative Layout Shift)** | <0.1 | maintenu |
| **Score Lighthouse Performance** | ~55-70 | ~75-85 |

> Note : Sans Lighthouse headless instrumenté en production, ces valeurs sont des estimations basées sur la waterfall locale. Le score réel peut être meilleur ou moins bon selon le CDN et le device.

---

## 10. Ce qui fonctionne bien ✅

- **Code splitting agressif** : 30 composants en lazy + chunks séparés → aucun code de panneau secondaire n'est chargé sur la home
- **Deferred CSS** : 6 fichiers CSS non-critiques chargés on-demand → réduit le CSS initial de ~290 kB
- **PurgeCSS** : réduit les CSS de 33-39% en production (ex. tailwind.css : -248 kB)
- **Preload prioritaire** : sura_names.woff2, logo-ui.webp chargés en parallèle du HTML
- **DNS-prefetch** : 10 CDN préconfigurés → réduit la latence des premiers appels API
- **Service Worker cache-first** : assets hashés servis instantanément depuis le cache
- **Stagger prefetch** : les 3 prochaines sourates sont préchargées à l'idle (configurable)
- **React.memo** sur AyahList, SurahMode, PageMode → évite les re-renders inutiles
- **useAppSelector** : sélecteurs granulaires qui évitent les re-renders globaux
- **Chunk recovery** : mécanisme de reload automatique en cas de chunk stale après déploiement
