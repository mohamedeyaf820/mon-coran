# Audit Qualité de Code — MushafPlus
**Date :** 2026-07-30  
**Branche :** `perf/load-times-and-bug-fixes`  
**Scope :** 217 fichiers `.js`/`.jsx` · 49 513 lignes · 31 fichiers CSS · 58 205 lignes CSS

---

## 1. Métriques Globales

### Top 15 fichiers par lignes

| # | Fichier | Lignes | Catégorie |
|---|---------|--------|-----------|
| 1 | `src/components/AyahActions.jsx` | **2 190** | Composant megalithe |
| 2 | `src/services/audioService.js` | **1 306** | Service (acceptable) |
| 3 | `src/components/AudioPlayer.jsx` | **1 197** | Composant trop lourd |
| 4 | `src/components/HomePage.jsx` | **1 065** | Composant trop lourd |
| 5 | `src/data/surahs.js` | 1 064 | Données statiques (ok) |
| 6 | `src/data/reciters.js` | 1 027 | Données statiques (ok) |
| 7 | `src/components/SettingsModal.jsx` | 957 | Composant trop lourd |
| 8 | `src/context/AppContext.jsx` | **899** | Context monolithe |
| 9 | `src/App.jsx` | 867 | App root trop lourd |
| 10 | `src/services/quranAPI.js` | 803 | Service (acceptable) |
| 11 | `src/components/FutureFeaturesModal.jsx` | 734 | Features non activées |
| 12 | `src/services/warshService.js` | 732 | Service ok |
| 13 | `src/services/storageService.js` | 725 | Service ok |
| 14 | `src/components/NotesPanel.jsx` | 713 | Panel ok |
| 15 | `src/components/Header.jsx` | 706 | Composant lourd |

**Total JS/JSX :** 49 513 lignes sur 217 fichiers — moyenne 228 lignes/fichier.  
**Total CSS :** 58 205 lignes sur 31 fichiers — dont `tailwind.css` 21 185 lignes (généré).

### CSS : Top 5 fichiers
| Fichier | Lignes | Note |
|---------|--------|------|
| `styles/tailwind.css` | 21 185 | Généré — ok |
| `styles/domains/reading-platform.css` | 4 863 | Très lourd |
| `styles/domains/search-home-polish.css` | 3 891 | Lourd |
| `styles/home-audio-ux-refonte.css` | 3 663 | Lourd |
| `styles/domains/reader-consolidation.css` | 3 612 | Lourd |

---

## 2. Dettes Techniques — TODO / FIXME / console.*

### Résultat brut
- **0 TODO, 0 FIXME, 0 HACK** dans le code source — excellent.
- **43 appels `console.*`** au total, répartis comme suit :

| Catégorie | Nb | Statut |
|-----------|-----|--------|
| `console.error()` dans catch/error handlers | ~22 | Acceptable (production log) |
| `console.warn()` dans catch/fallback | ~14 | Acceptable |
| `console.log()` non protégé | **1** | Problème |
| `console.log` gardé par `import.meta.env.DEV` | 4 | Correct |

**console.log non protégé :**
- `src/main.jsx:162` — `console.log("SW désactivé/nettoyé en mode développement")` — non protégé par `if (import.meta.env.DEV)`.

### console.warn/error en production sans condition DEV
Plusieurs `console.error` / `console.warn` dans des services s'exécutent en production. Ce n'est pas critique mais peut fuiter des détails d'implémentation :
- `src/services/readingStreakService.js:28,47,154,182` — 4 `console.error` inconditionnels
- `src/services/wordByWordService.js:150` — `console.error` inconditionnel
- `src/components/AyahActions.jsx:430` — `console.warn("Copy failed:")` inconditionnel

---

## 3. Dead Code

### 3.1 API audioService non consommée en dehors du service
| Méthode / Propriété | Fichier | Observation |
|--------------------|---------|-------------|
| `setAbRepeat(startIdx, endIdx)` | `audioService.js:1210` | Déclarée, jamais appelée depuis l'UI |
| `clearAbRepeat()` | `audioService.js:1214` | Idem |
| `setTartilMode(enabled, userSpeed)` | `audioService.js:1220` | Idem |
| `applyEqPreset(preset)` | `audioService.js:1275` | Idem — tout l'equalizer (90 lignes) est mort |
| `playWordAudio(url, meta)` | `audioService.js:610` | Wrapper de `playSingle` — aucun appel externe trouvé |
| `loadAndPlay(index)` | `audioService.js:965` | Wrapper public de `_loadAndPlay` — 1 seul usage dans `AyahActions.jsx:359` |

**Estimation dead code audioService :** ~120 lignes (equalizer + A-B repeat + tartil mode).

### 3.2 State inutilisé dans AppContext
| Clé | Fichier:Ligne | Observation |
|-----|--------------|-------------|
| `_prevMushafLayout` | `AppContext.jsx:300,306,307` | Clé d'état interne stockée en state global — antipattern |
| `weeklyStatsOpen` | `AppContext.jsx:99` | Présent mais aucun handler `TOGGLE_WEEKLY_STATS` dans le reducer |
| `tajweedQuizOpen` | `AppContext.jsx:95` | Idem |
| `khatmaOpen` | `AppContext.jsx:96` | Idem — ouverture passée par `set({khatmaOpen: true})` sans action dédiée |

### 3.3 Fonctions en double
Deux implémentations parallèles de fonctions de normalisation de thème :
- `src/services/storageService.js:373` — `normalizeTheme()` (privée)
- `src/data/themes.js:68` — `normalizeThemeId()` (exportée)

Les deux font la même chose. `storageService.js` devrait importer depuis `themes.js`.

Deux implémentations de `clampSurah` :
- `src/context/AppContext.jsx:39` — `const clampSurah = ...`
- `src/services/storageService.js:167` — `function clampSurah(value)` (privée)

---

## 4. Complexité

### 4.1 Composants > 300 lignes (seuil recommandé)

| Composant | Lignes | useEffect | useState | Commentaire |
|-----------|--------|-----------|----------|-------------|
| `AyahActions.jsx` | **2 190** | ? | **13** | Contient tafsir, notes, partage, mémorisation, favoris, playlist — devrait être 6+ composants |
| `AudioPlayer.jsx` | **1 197** | **22** | 10 | 22 useEffect dans un seul composant |
| `HomePage.jsx` | **1 065** | 54 hooks | ~10 | 54 hooks au total — très lourd |
| `SettingsModal.jsx` | 957 | 11 hooks | — | Modal monolithique |
| `App.jsx` | 867 | 12 | — | Root trop lourd |
| `Header.jsx` | 706 | — | — | — |
| `ContentSection.jsx` | 699 | — | — | Section de homepage |
| `SearchModal.jsx` | 628 | — | — | — |
| `QuranDisplay.jsx` | 598 | 2 | 2 | Bien décomposé grâce aux hooks |

### 4.2 useEffect avec beaucoup de dépendances

**`src/context/AppContext.jsx`** — `persistentSettings` useMemo :
```js
// Ligne 491–590 : ~40 dépendances dans un seul useMemo
const persistentSettings = useMemo(() => ({...}), [
  state.lang, state.theme, state.splashDone, state.riwaya, state.reciter,
  state.quranFontSize, state.quranTranslationFontSize, state.fontFamily,
  state.fontFamilyByRiwaya, state.translationLangs, state.wordTranslationLang,
  state.showTranslation, state.showTajwid, state.showWordByWord,
  // ... 30 autres dépendances
]);
```
Ce useMemo se recalcule à chaque changement d'état, ce qui annule son bénéfice pour de nombreuses transitions UI.

**`src/components/AudioPlayer.jsx`** — wire callbacks useEffect :
```js
// Ligne 388–517 : useEffect avec 8 dépendances
useEffect(() => {
  audioService.onPlay = ...
  // 130 lignes de callbacks
}, [dispatch, lang, markReciterAvailable, markReciterUnavailable, reciter, riwaya, set, tryAutoReciterFailover]);
```
Chaque changement de `lang` (ex. : changement de langue en cours de lecture) re-registre **tous** les callbacks audio.

### 4.3 Fonctions > 100 lignes

| Fonction | Fichier | Lignes approx. |
|----------|---------|----------------|
| `_loadUrlWithRetry()` | `audioService.js:744` | ~170 lignes |
| `loadPlaylist()` | `audioService.js:248` | ~145 lignes |
| `appReducer()` case `"SET"` | `AppContext.jsx:202` | ~80 lignes (ce seul case) |
| `tryAutoReciterFailover()` | `AudioPlayer.jsx:172` | ~85 lignes |
| Composant `AyahActions` body | `AyahActions.jsx:86` | ~2100 lignes |

---

## 5. Duplications

### 5.1 Pattern i18n inline — le plus grave

**530 occurrences** de `lang === "fr" ? "..." : lang === "ar" ? "..." : "..."` dans `src/components`, au lieu d'utiliser `t()`.

Exemples du pire cas — `AyahActions.jsx` :
```jsx
// AyahActions.jsx — 137 occurrences de lang === "fr"
lang === "fr" ? "Copier le verset" : lang === "ar" ? "نسخ الآية" : "Copy verse"
lang === "fr" ? "Verset copié !" : lang === "ar" ? "تم نسخ الآية" : "Verse copied!"
```

Même pattern dans :
- `AudioPlayer.jsx` : 18 occurrences
- `HomePage.jsx` : 10 occurrences
- `QuranDisplay.jsx` : ~10 occurrences

Ces chaînes **ne passent pas** par `t()` donc elles ne bénéficient pas du mécanisme i18n centralisé.

### 5.2 Duplication de logique CSS player

Les classes CSS du lecteur audio sont **construites en ligne dans `AudioPlayer.jsx`** (lignes 946–976) plutôt que dans le fichier CSS :
```jsx
const playerSoftSurfaceClass = "rounded-[20px] border border-[color-mix(...)] ...";
const playerSectionLabelClass = "mb-2 text-[0.56rem] font-bold ...";
// 8 constantes de classes CSS définies inline
```
Ces constantes sont passées en props à `AudioOptionsModal` (lignes 991–1036 : **35 props**).

### 5.3 Duplication de récupération du reciteur courant

```js
// AudioPlayer.jsx:738 — appel en render (non mémoïsé)
const currentReciters = sortRecitersByPreference(getRecitersByRiwaya(riwaya), {...});
// AudioPlayer.jsx:751 — filtrage dans useMemo basé sur currentReciters recalculé
const filteredReciters = React.useMemo(() => {...}, [currentReciters, reciterSearch]);
```
`currentReciters` est recalculé à chaque render même si `riwaya` n'a pas changé.

### 5.4 Duplication des normalizers de thème

Voir §3.3. `normalizeTheme` existe dans deux fichiers distincts avec une logique légèrement différente.

---

## 6. Architecture — AppContext Monolithe

### État actuel
`AppContext.jsx` (899 lignes) gère **un seul store global** avec ~45 clés d'état couvrant :

| Domaine | Clés | Proportion |
|---------|------|-----------|
| UI panels (modals open/close) | 15 booléens | ~33% |
| Quran reading state | 10 clés | ~22% |
| Audio state | 8 clés | ~18% |
| Display/font preferences | 8 clés | ~18% |
| Auto-night mode | 5 clés | ~9% |

**Problème principal :** 15 booléens `*Open` (sidebarOpen, searchOpen, settingsOpen, bookmarksOpen, wirdOpen, historyOpen, playlistOpen, flashcardsOpen, tajweedQuizOpen, khatmaOpen, comparatorOpen, shareImageOpen, weeklyStatsOpen, audioMakerOpen, toolsHubOpen) sont **dans le même état global que les préférences audio et de lecture**. Toute ouverture d'un modal déclenche un re-render sur tous les consommateurs de `useAppState()`.

**`useApp()` — anti-pattern :**
```jsx
// AppContext.jsx:893-897
export function useApp() {
  const state = useAppState(); // lit TOUT l'état
  const { dispatch, set } = useAppActions();
  return useMemo(() => ({ state, dispatch, set }), [state, dispatch, set]);
}
```
17 composants utilisent `useApp()` — ils re-rendent à **chaque changement d'état**, même pour des mutations sans rapport (ex. `currentPlayingAyah` change → `ReadingToolbar` re-rend).

### Proposition de découpe

```
AppContext.jsx (899 lignes) → 4 contextes séparés :

1. UIContext  (~120 lignes)
   - sidebarOpen, searchOpen, settingsOpen, bookmarksOpen, wirdOpen,
     historyOpen, playlistOpen, flashcardsOpen, tajweedQuizOpen, khatmaOpen,
     comparatorOpen, shareImageOpen, weeklyStatsOpen, audioMakerOpen,
     toolsHubOpen, futureHubOpen, tafsirSidebarOpen, tafsirSidebarVerse
   - Actions: TOGGLE_* dédiés

2. PreferencesContext  (~200 lignes)
   - lang, theme, riwaya, fontFamily, fontFamilyByRiwaya, quranFontSize,
     showTranslation, showTajwid, showWordByWord, translationLangs,
     karaokeFollow, focusReading, autoNightMode, nightStart, nightEnd, ...
   - Persistance localStorage déportée ici

3. ReaderContext  (~150 lignes)
   - currentSurah, currentAyah, currentPage, currentJuz, displayMode,
     mushafLayout, memMode, memRepeatCount, memPause, surahRepeatCount
   - Actions: NAVIGATE_SURAH, NAVIGATE_PAGE, NAVIGATE_JUZ, TOGGLE_MEM_MODE

4. AudioContext  (~100 lignes)
   - reciter, isPlaying, currentPlayingAyah, volume, audioSpeed,
     syncOffsetsMs, favoriteReciters, playerMinimized, ...
   - Actions: SET_RECITER, SET_PLAYING, SET_VOLUME, ...
```

---

## 7. Error Handling

### 7.1 Empty catch blocks — silencing exceptions

13 `catch {}` vides identifiés :

| Fichier | Ligne | Contexte |
|---------|-------|---------|
| `audioPlayer/audioPlayerUtils.js` | 39, 47, 53 | Lecture/écriture de localStorage |
| `NotesPanel.jsx` | 18, 25 | Chargement des notes — erreur silencieuse visible par l'utilisateur |
| `WeeklyStatsPanel.jsx` | 212 | Chargement stats |
| `downloadService.js` | 412 | Suppression de fichiers téléchargés |
| `khatmaService.js` | 35 | Service Khatma |
| `readingProgressService.js` | 52 | Progression de lecture |
| `recentHistoryService.js` | 42 | Historique récent |
| `warshService.js` | 584, 626 | Service Warsh |
| `AudioQueueStore.js` | 18 | Queue audio |

**Problème critique :** `NotesPanel.jsx:18` et `NotesPanel.jsx:25` — si le chargement des notes échoue silencieusement, l'utilisateur voit un panel vide sans message d'erreur.

### 7.2 Promesses `.catch(() => {})` — swallowing silencieux

20+ occurrences dans tout le codebase — la plupart sont des opérations de prefetch (normales), mais certaines méritent attention :

| Fichier | Ligne | Sévérité |
|---------|-------|---------|
| `App.jsx:284` | `.catch(() => {})` sur init audio | Moyen — peut masquer un bug de démarrage |
| `Header.jsx:146` | `.catch(() => {})` | Moyen |
| `useQuranDisplayData.js:129,135,283` | `.catch(() => {})` | Moyen — données critiques |
| `AyahBlock.jsx:106` | `addBookmark(...).catch(() => {})` | Faible — UI feedback manquant |
| `context/AppContext.jsx:715` | `.catch(() => {})` sur ranking reciteur | Faible |
| `context/AppContext.jsx:785` | `.catch(() => {})` sur prayer times | Faible |

### 7.3 Fetch sans vérification `response.ok`

Tous les `await fetch()` dans les services principaux vérifient `response.ok`. Aucun manque critique identifié.

---

## 8. Type Safety

### 8.1 PropTypes — absents à 100%
```
grep -r "PropTypes" src/ → 0 résultat
```
Aucun composant n'utilise PropTypes. Avec React 18 sans TypeScript, cela représente un risque significatif de régressions silencieuses. Exemples de props non typées :

- `AyahActions.jsx:86` — `{ surah, ayah, ayahData, compact, layout }` — pas de type, pas de defaultProps
- `AudioPlayer.jsx` — aucun prop (composant autonome — ok dans ce cas)
- `SimpleAudioPlayerView.jsx` — 40+ props passées sans types

### 8.2 Valeurs par défaut manquantes

| Fichier | Prop | Problème |
|---------|------|---------|
| `AyahActions.jsx:86` | `compact = false, layout = "horizontal"` | Défauts présents — ok |
| `AudioPlayer.jsx` | aucune prop | ok |
| `SimpleAudioPlayerView.jsx` | 40+ props | aucune valeur par défaut, pas de validation |

### 8.3 Accès sans guard

- `AudioPlayer.jsx:849` — `const { currentSurah } = state;` après destructuration imbriquée — fonctionnel mais fragile
- `audioService.js:1204` — `getLatencyForKey(key)` retourne `null` si absente — les consommateurs doivent gérer `null`

---

## 9. Nommage

### 9.1 Incohérences FR/EN dans les variables (code source)

| Fichier | Identifiant | Problème |
|---------|-------------|---------|
| `audioService.js:14` | `devLog(method, ...args)` | ok — anglais cohérent |
| `AppContext.jsx:46` | `getInitialState` | ok |
| `AppContext.jsx:731` | Commentaire `// Delai pour ne pas bloquer le demarrage` | Commentaire en français sans accents |
| `AppContext.jsx:786` | `// Attendre 2 secondes apres le chargement initial` | Idem |

Les commentaires dans `AppContext.jsx` et `audioService.js` mélangent français et anglais de manière incohérente.

### 9.2 Noms trop génériques

| Fichier:Ligne | Nom | Problème |
|---------------|-----|---------|
| `AudioPlayer.jsx:604` | `const toggle` | Trop générique — `togglePlayPause` serait plus clair |
| `AudioPlayer.jsx:605` | `const stop` | ok dans ce contexte |
| `AppContext.jsx:818` | `const set` | Très générique — dispatch partiel nommé `set` dans tout le codebase |
| `audioService.js:965` | `loadAndPlay(index)` | Wrapper public redondant avec `_loadAndPlay` |
| Multiple | `handleNavigateToAyah` vs `goToAyah` vs `playSpecificSurah` | Inconsistance de naming pour les actions de navigation |

### 9.3 Convention `_` pour méthodes privées dans une classe JS

`audioService.js` utilise correctement le préfixe `_` pour les méthodes privées (`_loadAndPlay`, `_preloadTrack`, etc.). Cependant, `loadAndPlay` (sans `_`) à la ligne 965 est un **wrapper public inutile** qui expose `_loadAndPlay` en créant une incohérence.

### 9.4 État `futureHubOpen` — type ambigu

```js
futureHubOpen: null,  // AppContext.jsx:102
// Utilisé comme: set({ futureHubOpen: "offline" }) — c'est un string ou null
```
Le nom `futureHubOpen` est un booléen (open/closed) mais la valeur est un string (tab initial). Devrait s'appeler `futureHubInitialTab` ou `futureHubTab`.

---

## 10. Score Dette Technique et Top 10 Actions

### Score Global : **4.5 / 10** (dette modérée)

**Points positifs :**
- Architecture Context/Selector bien pensée (`useAppSelector` + `useSyncExternalStore`)
- audioService bien structuré avec retry, preload, latency tracking
- `useKaraoke`, `useAutoScrollAyah` — hooks propres et focalisés
- 0 TODO/FIXME — code nettoyé
- Lazy loading des modes (JuzMode, PageMode, FullscreenMushafOverlay)
- Gestion des erreurs présente dans les cas critiques (fetch, audio errors)

**Points négatifs principaux :**
- `AyahActions.jsx` (2190 lignes) — dossier de toutes les fonctionnalités
- 530 ternaires i18n inline (bypass du système `t()`)
- 22 useEffect dans AudioPlayer
- Dead code : equalizer, A-B repeat, tartil mode (jamais consommés depuis l'UI)
- Zéro PropTypes sur 217 fichiers

---

### Top 10 Actions Prioritaires

| Priorité | Action | Fichier(s) | Impact |
|----------|--------|-----------|--------|
| **P1** | **Éclater `AyahActions.jsx` (2190 lignes)** en sous-composants : `AyahNotePanel`, `AyahSharePanel`, `AyahTafsirPanel`, `AyahMemorizationControl`, `AyahBookmarkButton`, `AyahPlayButton` | `src/components/AyahActions.jsx` | Maintenabilité, lisibilité, performance |
| **P2** | **Migrer les 530 ternaires i18n inline** vers des clés dans `src/i18n/[fr|en|ar].js` + appels `t()` | `AyahActions.jsx` (137), `AudioPlayer.jsx` (18), `HomePage.jsx` (10), etc. | Maintenabilité, cohérence i18n |
| **P3** | **Réduire les useEffect d'AudioPlayer** — regrouper les callbacks audioService en un seul effet, extraire la logique de dragging dans `usePlayerDrag`, la logique de viewport dans `usePlayerViewport` | `src/components/AudioPlayer.jsx` | Lisibilité, perf |
| **P4** | **Supprimer les 35 props passées à AudioOptionsModal** en extrayant les classes CSS vers `audio-player-simple.css` et en remplaçant par 2-3 props sémantiques | `AudioPlayer.jsx:991–1036`, `AudioOptionsModal.jsx` | Maintenabilité |
| **P5** | **Supprimer le dead code audioService** : equalizer (lignes 1233–1279, ~50 lignes), A-B repeat (1209–1217), tartil mode (1219–1231), wrapper public `loadAndPlay` (965) | `src/services/audioService.js` | Taille du bundle (-~120 lignes) |
| **P6** | **Séparer les 15 booléens panel-open du state global** vers un `UIContext` local — les mutations modal ne doivent pas déclencher le re-render des composants de lecture | `src/context/AppContext.jsx` | Performance React |
| **P7** | **Corriger les empty catch en NotesPanel et services** — afficher un message d'erreur utilisateur au minimum | `NotesPanel.jsx:18,25`, `khatmaService.js:35`, `readingProgressService.js:52` | UX, fiabilité |
| **P8** | **Consolider les normalizers dupliqués** — `storageService.js` doit importer `normalizeThemeId/normalizeDayTheme/normalizeNightTheme` depuis `data/themes.js` au lieu de les redéfinir | `src/services/storageService.js:373-395` | DRY, cohérence |
| **P9** | **Protéger `console.log` restant** dans `src/main.jsx:162` avec `if (import.meta.env.DEV)` + audit des `console.error` inconditionnels dans les services de streak/word-by-word | `src/main.jsx:162`, `readingStreakService.js:28,47,154,182` | Production hygiene |
| **P10** | **Mémoïser `currentReciters`** dans AudioPlayer (ligne 738) avec `useMemo([riwaya, reciter, favoriteReciters, reciterLatencyByKey, reciterAvailabilityById])` pour éviter le recalcul à chaque render | `src/components/AudioPlayer.jsx:738` | Performance |

---

*Rapport généré le 2026-07-30 — aucune modification de code effectuée.*
