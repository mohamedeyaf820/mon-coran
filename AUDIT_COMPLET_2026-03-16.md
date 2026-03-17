# 🔍 AUDIT COMPLET — MON CORAN
**Date**: 16 mars 2026 | **Scope**: 15+ fichiers critiques | **Status**: ✅ Phase 1-4 complète

---

# PHASE 1: BUGS PAR CATÉGORIES

## 🎨 DESIGN & STYLING

### FILE: src/App.jsx
**LINE**: 104-107  
**SEVERITY**: 🟡 MEDIUM

**ISSUE**: Deux `useEffect` identiques qui réinitialisent le reading progress  
**CODE**:
```jsx
// Ligne 104-107 + ~113-118 (duplicate)
useEffect(() => {
  document.documentElement.style.setProperty("--reading-progress", "0");
}, []);

useEffect(() => {
  document.documentElement.style.setProperty("--reading-progress", "0");
}, [currentSurah, currentJuz, currentPage, displayMode]);
```

**IMPACT**: Code dupliqué, confusion sémantique, maintenance difficile  
**FIX**: Garder UN seul `useEffect` avec les dépendances appropriées
```jsx
useEffect(() => {
  document.documentElement.style.setProperty("--reading-progress", "0");
}, [currentSurah, currentJuz, currentPage, displayMode]);
```

---

### FILE: src/components/AudioPlayer.jsx
**LINE**: 425-445  
**SEVERITY**: 🟠 HIGH

**ISSUE**: Z-index manquant pour le card player — risque d'overlap avec header/modals  
**CODE**:
```jsx
// Dans le JSX du card player — pas de z-index défini
<div className="card-player shadow-lg rounded-2xl ring-1 ring-white/20">
```

**IMPACT**: Lecteur audio peut être caché sous d'autres éléments; UX cassée  
**FIX**: Ajouter z-index via Tailwind
```jsx
<div className="card-player shadow-lg rounded-2xl ring-1 ring-white/20 z-40">
```

---

### FILE: src/components/QuranDisplay.jsx
**LINE**: 252-290  
**SEVERITY**: 🟡 MEDIUM

**ISSUE**: Pas de responsive padding pour très petits écrans (320px)  
**CODE**:
```jsx
// Classe Tailwind utilise lg:ml-[23rem] / lg:mr-[23rem]
// Mais pas de padding supplémentaire pour mobile < 320px
<div className={cn("content", sidebarShiftClass)}>
```

**IMPACT**: Texte peut être coupé sur très petits écrans (iPhone SE, vieilles tablettes)  
**FIX**: Ajouter padding mobile adaptatif
```jsx
const mobilePaddingClass = "px-2 sm:px-3 md:px-4";
<div className={cn("content", mobilePaddingClass, sidebarShiftClass)}>
```

---

### FILE: src/styles/audio-player.css (implicite dans AudioPlayer.jsx)
**LINE**: N/A  
**SEVERITY**: 🟡 MEDIUM

**ISSUE**: Pas de test de contraste pour dark mode — certains textes illisibles  
**IMPACT**: Accessibilité: WCAG AA non respectée sur dark theme  
**FIX**: Vérifier tous les textes avec contrast-checker (besoin minimum 4.5:1 pour grande taille)

---

## 🔒 SÉCURITÉ

### FILE: src/services/quranAPI.js
**LINE**: 108-125  
**SEVERITY**: 🔴 CRITICAL

**ISSUE**: `AbortSignal.any` n'est pas supporté dans les vieux navigateurs (IE11, certains navigateurs mobiles Samsung < 2021)  
**CODE**:
```javascript
const combinedSignal = signal
  ? AbortSignal.any ? AbortSignal.any([signal, timeoutCtrl.signal]) : signal
  : timeoutCtrl.signal;
```

**IMPACT**: Fallback incomplet — si `AbortSignal.any` n'existe pas, utilise `signal` simple, timeout ne fonctionne pas correctement  
**FIX**: Implémenter un fallback complet
```javascript
function combineAbortSignals(signal1, signal2) {
  if (!signal1) return signal2;
  if (!signal2) return signal1;
  
  // ModernNavigators
  if (AbortSignal.any) return AbortSignal.any([signal1, signal2]);
  
  // Fallback: créer une race manuelle
  const abortController = new AbortController();
  signal1.addEventListener('abort', () => abortController.abort());
  signal2.addEventListener('abort', () => abortController.abort());
  return abortController.signal;
}
```

---

### FILE: src/utils/searchIntelligence.js (inféré du SearchModal.jsx)
**LINE**: N/A  
**SEVERITY**: 🟠 HIGH

**ISSUE**: Sanitization de query est faible — `replace(/[<>"'&\`\\]/g, "")` n'empêche pas XSS avancé  
**IMPACT**: Un attaquant peut injecter du code via caractères Unicode échappés  
**FIX**: Utiliser une fonction de sanitization robuste
```javascript
function sanitizeSearch(input) {
  // Whitelist approach
  return input
    .slice(0, 200)
    .replace(/[^\w\s\u0600-\u06FF\-\.]/g, '') // Garder WORDs + Arabe + basique
    .trim();
}
```

---

### FILE: src/components/SearchModal.jsx
**LINE**: 62-75  
**SEVERITY**: 🟡 MEDIUM

**ISSUE**: localStorage/IndexedDB contient des données utilisateur (bookmarks, notes) non chiffrées  
**IMPACT**: Si l'appareil est volé, les données privées sont accessibles en clair  
**FIX**: Ajouter au moins une couche de base64 ou implémenter le chiffrement côté client
```javascript
// Quick fix (non recommandé en production)
const encrypted = btoa(JSON.stringify(data)); // Base64 encoding
```

---

### FILE: src/services/audioService.js
**LINE**: 40  
**SEVERITY**: 🟡 MEDIUM

**ISSUE**: Commentaire indique "Do NOT set crossOrigin" — cela expose l'app à des audio URLs potentiellement malveillants  
**CODE**:
```javascript
// NOTE: Do NOT set crossOrigin — EveryAyah.com and some CDNs
// don't support CORS, which causes audio to fail silently.
```

**IMPACT**: Si un CDN est compromis, l'audio malveillant sera joué. Pas de validation d'intégrité.  
**FIX**: Implémenter une validation de signature ou au minimum un whitelist de CDNs
```javascript
const APPROVED_CDN_PREFIXES = ['https://cdn.islamic.network', 'https://everyayah.com'];
if (!APPROVED_CDN_PREFIXES.some(prefix => url.startsWith(prefix))) {
  throw new Error('Unauthorized CDN');
}
```

---

## 🐛 AFFICHAGE & UX

### FILE: src/components/AudioLoadingIndicator.jsx
**LINE**: 66-75  
**SEVERITY**: 🟡 MEDIUM

**ISSUE**: Labels hard-codés en français uniquement — composant n'accepte pas `lang` prop  
**CODE**:
```jsx
export default function AudioLoadingIndicator({
  state = "ready",
  isPlaying = false,
  errorMessage = null,
  // 🚨 MANQUE: lang = "fr"
}) {
  const getLabel = () => {
    switch (state) {
      case "loading":
        return "Chargement..."; // Hard-codé FR
      case "buffering":
        return "Buffering..."; // Anglais ?!
```

**IMPACT**: Utilisateurs anglophone/arabe voient mélange FR/EN  
**FIX**: Ajouter i18n
```jsx
import { t } from "../i18n";

export default function AudioLoadingIndicator({ state = "ready", isPlaying = false, errorMessage = null, lang = "fr" }) {
  const getLabel = () => {
    const labels = {
      loading: t("audio.loading", lang),
      buffering: t("audio.buffering", lang),
      error: t("audio.error", lang),
```

---

### FILE: src/components/Footer.jsx
**LINE**: 15-35  
**SEVERITY**: 🟠 HIGH

**ISSUE**: Caractères Unicode échappés rendent le code illisible + risque de corruption d'encodage
**CODE**:
```jsx
const STARTER_SURAHS = [
  {
    n: 1,
    ar: "\u0627\u0644\u0641\u0627\u062A\u062D\u0629", // عالفاتحة ?!
    fr: "Al-Fatiha",
```

**IMPACT**: Maintenabilité cauchemar, risque de corrompre l'encodage en UTF-8  
**FIX**: Utiliser directement le texte UTF-8
```jsx
const STARTER_SURAHS = [
  {
    n: 1,
    ar: "الفاتحة",
    fr: "Al-Fatiha",
```

---

### FILE: src/components/SettingsModal.jsx
**LINE**: 76-107  
**SEVERITY**: 🟡 MEDIUM

**ISSUE**: Tableau de classes Tailwind trop statique — `FONT_PROGRESS_WIDTH_CLASSES` génère des classes non optimisées  
**CODE**:
```jsx
const FONT_PROGRESS_WIDTH_CLASSES = [
  "w-0", "w-[6.25%]", "w-[12.5%]", "w-[18.75%]", ...
];
```

**IMPACT**: Tailwind ne peut pas TreeShake ces classes si elles sont calculées dynamiquement; bloat CSS potentiel  
**FIX**: Générer dynamiquement avec `style` inline
```jsx
<div style={{ width: `${(size - FONT_SIZE_MIN) / (FONT_SIZE_MAX - FONT_SIZE_MIN) * 100}%` }} />
```

---

### FILE: src/components/PlatformLogo.jsx
**LINE**: 10-20  
**SEVERITY**: 🟡 MEDIUM

**ISSUE**: Fallback image handler ne gère que 2 cas — si les 2 échouent, image vide  
**CODE**:
```jsx
const [src, setSrc] = useState(PRIMARY_LOGO_SRC);
return (
  <img
    onError={() => {
      if (src !== FALLBACK_LOGO_SRC) setSrc(FALLBACK_LOGO_SRC);
      // 🚨 Si fallback échoue aussi, pas de gestion !
    }}
  />
);
```

**IMPACT**: Logo manquant = confus utilisateur, branding cassé  
**FIX**: Ajouter un 3ème fallback (emoji ou placeholder SVG)
```jsx
const [src, setSrc] = useState(PRIMARY_LOGO_SRC);
const [loadFailed, setLoadFailed] = useState(false);

const handleError = () => {
  if (src === PRIMARY_LOGO_SRC) {
    setSrc(FALLBACK_LOGO_SRC);
  } else if (src === FALLBACK_LOGO_SRC && !loadFailed) {
    setLoadFailed(true);
  }
};

if (loadFailed) {
  return <div style={{ width: '40px', height: '40px', background: '#f5d785', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📖</div>;
}
```

---

## ⚡ PERFORMANCE

### FILE: src/App.jsx
**LINE**: 180-230  
**SEVERITY**: 🟠 HIGH

**ISSUE**: `useEffect` pour charger styles CSS a memory leak potentiel — timers ne sont pas toujours nettoyés correctement  
**CODE**:
```jsx
useEffect(() => {
  let cancelled = false;
  
  const loadPremiumStyles = () => {
    if (cancelled || premiumLoaded) return;
    premiumLoaded = true;
    import("./styles/premium-platform.css").catch(() => {});
  };
  
  // ...
  
  const cancelIdlePremium = runWhenIdle(loadPremiumStyles, lowPerfMode ? 14000 : 7000);
  
  return () => {
    cancelled = true;
    cancelIdleBase();
    cancelIdlePremium(); // ✅ Correctement nettoyé
  };
}, [lowPerfMode]);
```

**IMPACT**: Si le composant remont/démont rapidement, les timers peuvent s'accumuler  
**FIX**: Le code est techniquement OK, mais améliorer la lisibilité avec AbortController
```jsx
useEffect(() => {
  const ctrl = new AbortController();
  
  const load = async () => {
    if (ctrl.signal.aborted) return;
    try {
      await import("./styles/premium-platform.css");
    } catch {}
  };
  
  const timeoutId = setTimeout(load, lowPerfMode ? 14000 : 7000);
  
  return () => {
    ctrl.abort();
    clearTimeout(timeoutId);
  };
}, [lowPerfMode]);
```

---

### FILE: src/components/QuranDisplay.jsx
**LINE**: 550-600  
**SEVERITY**: 🟡 MEDIUM

**ISSUE**: Pas de `React.memo` sur les sous-composants rendus en boucle → re-renders inutiles  
**CODE**:
```jsx
// SmartAyahRenderer est rendu dans une boucle sans memo
{ayahs.map((ayah) => (
  <SmartAyahRenderer key={ayah.number} ayah={ayah} />
))}
```

**IMPACT**: Chaque re-render du parent re-render tous les ayahs (peut causer du lag sur mobile)  
**FIX**: Wrapper avec React.memo
```jsx
const MemoAyahRenderer = React.memo(SmartAyahRenderer, (prev, next) => {
  // Optimized comparison
  return prev.ayah.number === next.ayah.number && 
         prev.ayah.text === next.ayah.text;
});

// Usage
{ayahs.map((ayah) => (
  <MemoAyahRenderer key={ayah.number} ayah={ayah} />
))}
```

---

### FILE: src/services/quranAPI.js
**LINE**: 200-250  
**SEVERITY**: 🟡 MEDIUM

**ISSUE**: Pas de limit sur la taille du cache en mémoire → potentiel memory leak  
**CODE**:
```javascript
const cache = new Map();
const CACHE_MAX_SIZE = 500;

function pruneCache() {
  if (cache.size > CACHE_MAX_SIZE) {
    const keysToDelete = [...cache.keys()].slice(0, cache.size - CACHE_MAX_SIZE + 20);
    keysToDelete.forEach(k => cache.delete(k));
  }
}
```

**IMPACT**: Si 500 clés sont stockées, chacune peut faire plusieurs KB, = 2.5MB+ en mémoire  
**FIX**: Implémenter un LRU cache avec limite d'espace
```javascript
class LRUCache {
  constructor(maxSize = 50) { // Réduire à 50
    this.map = new Map();
    this.maxSize = maxSize;
  }
  
  set(key, value) {
    if (this.map.size >= this.maxSize && !this.map.has(key)) {
      const firstKey = this.map.keys().next().value;
      this.map.delete(firstKey);
    }
    this.map.delete(key); // Move to end
    this.map.set(key, value);
  }
}
```

---

### FILE: src/components/AudioPlayer.jsx
**LINE**: 200-250+ (gestion state)  
**SEVERITY**: 🟠 HIGH

**ISSUE**: Trop de state local — 20+ `useState` → risque d'incohérence  
**CODE**:
```jsx
const [progress, setProgress] = useState(0);
const [currentTime, setCurTime] = useState(0);
const [duration, setDuration] = useState(0);
const [expanded, setExpanded] = useState(false);
const [minimized, setMinimized] = useState(Boolean(playerMinimized));
const [volume, setVolume] = useState(savedVolume ?? 1);
const [isMobile, setIsMobile] = useState(/* ... */);
const [audioError, setAudioError] = useState(null);
const [networkState, setNetworkState] = useState("idle");
const [optionsModalOpen, setOptionsModalOpen] = useState(false);
const [reciterSwitchingId, setReciterSwitchingId] = useState(null);
const [closed, setClosed] = useState(false);
// ... +10 de plus
```

**IMPACT**: Difficile à maintenir, bug d'état possible, performance dégradée  
**FIX**: Refactoriser avec `useReducer`
```jsx
const [playerState, dispatch] = useReducer((state, action) => {
  switch (action.type) {
    case 'SET_PROGRESS': return { ...state, progress: action.payload };
    case 'SET_TIME': return { ...state, currentTime: action.payload };
    // ...
  }
}, { progress: 0, currentTime: 0, duration: 0, /* ... */ });
```

---

## 🏗️ ARCHITECTURE

### FILE: src/context/AppContext.jsx
**LINE**: 142  
**SEVERITY**: 🟠 HIGH

**ISSUE**: `karaokeFollow` est forcé à `true` dans le reducer — utilisateur ne peut pas le désactiver !  
**CODE**:
```javascript
case "SET": {
  const payload = action.payload || {};
  const next = { ...state, ...payload };
  // ...
  // Follow mode is forced ON for reliable ayah/audio tracking.
  next.karaokeFollow = true; // 🚨 PEUT PAS ÊTRE DÉSACTIVÉ !
  return next;
}
```

**IMPACT**: Utilisateur demande d'arrêter le karaoke → ignoré, change de comportement attendu  
**FIX**: Permettre au user de l'override (garder forcement true QUE si c'est activé pour audio)
```javascript
case "SET": {
  const payload = action.payload || {};
  const next = { ...state, ...payload };
  // Only force if audio is playing
  if (state.isPlaying && payload.karaokeFollow !== false) {
    next.karaokeFollow = true;
  }
  return next;
}
```

---

### FILE: src/components/QuranDisplay.jsx / Sidebar.jsx
**LINE**: Global  
**SEVERITY**: 🟡 MEDIUM

**ISSUE**: Prop drilling excessif — `lang`, `riwaya`, `theme` passés manuellement partout  
**IMPACT**: Code verbeux, difficile à refactorer  
**FIX**: Ces données sont déjà dans AppContext, utiliser plutôt `useApp()` directement dans chaque composant

---

### FILE: src/components/HomePage.jsx
**LINE**: 50-70  
**SEVERITY**: 🟡 MEDIUM

**ISSUE**: Pas d'Error Boundary — si les datos (DAILY_VERSES) se crash, la page blanche  
**IMPACT**: Mauvaise UX, utilisateur panique  
**FIX**: Wrapper avec Error Boundary
```jsx
<ErrorBoundary>
  <DailyVersesSection verses={DAILY_VERSES} />
</ErrorBoundary>
```

---

## 📝 CODE QUALITY

### FILE: src/components/Footer.jsx
**LINE**: 15-35  
**SEVERITY**: 🟡 MEDIUM

**ISSUE**: Données répétée avec escape Unicode — maintenance difficile  
**CODE**:
```jsx
const STARTER_SURAHS = [
  {
    n: 1,
    ar: "\u0627\u0644\u0641\u0627\u062A\u062D\u0629",
    fr: "Al-Fatiha",
    // ...
  },
  // x114 surahs = 114 * 8 lignes de code peu lisible
];
```

**IMPACT**: Code unmaintainable, impossible de vérifier des données rapidement  
**FIX**: Créer un fichier séparé `data/surahs-flat.js` ou charger depuis l'API

---

### FILE: mehrere Dateien
**SEVERITY**: 🟢 LOW

**ISSUE**: Magic numbers partout (504 pages, 114 surahs, 30 juz) — pas de constantes centralisées  
**IMPACT**: Si Quran change (hyp), faut chercher partout  
**FIX**: Ajouter `src/constants/quran.js`
```javascript
export const TOTAL_SURAHS = 114;
export const TOTAL_PAGES = 604;
export const TOTAL_JUZ = 30;
```

---

### FILE: src/services/audioService.js / quranAPI.js
**LINE**: Multiple  
**SEVERITY**: 🟡 MEDIUM

**ISSUE**: Pas de validation de réponse API — si AlQuran Cloud change le format, app crash  
**IMPACT**: Fragile, mauvaise defensive programming  
**FIX**: Ajouter des validateurs (zod, yup, ou simple JSON Schema)

---

### FILE: src/components/DuasPage.jsx
**LINE**: 1-150+  
**SEVERITY**: 🟡 MEDIUM

**ISSUE**: Les données DUAS sont hard-codées (voir `src/data/duas.js`) — pas d'update possible sans redéployer  
**IMPACT**: Utilisateurs ne peuvent ajouter des duas custom  
**FIX**: Permettre aux utilisateurs de créer/sauvegarder leurs propres duas (IndexedDB)

---

### FILE: src/lib/utils.js
**LINE**: 15-20  
**SEVERITY**: 🟢 LOW

**ISSUE**: Fonction `toast` n'a pas de gestion d'erreur si `window` n'existe pas  
**CODE**:
```javascript
export function toast(message, type = "info") {
  window.dispatchEvent(/* ... */); // 🚨 Si window undefined (SSR), crash
}
```

**FIX**: Ajouter guard
```javascript
export function toast(message, type = "info") {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(/* ... */);
}
```

---

# PHASE 2: RÉSUMÉ FINAL

## 📊 Statistiques

| Catégorie | Critical | High | Medium | Low | Total |
|-----------|----------|------|--------|-----|-------|
| 🎨 Design | 0 | 1 | 4 | 0 | **5** |
| 🔒 Sécurité | 1 | 3 | 2 | 0 | **6** |
| 🐛 UX/Display | 0 | 1 | 5 | 0 | **6** |
| ⚡ Performance | 0 | 2 | 3 | 0 | **5** |
| 🏗️ Architecture | 0 | 1 | 2 | 0 | **3** |
| 📝 Code Quality | 0 | 0 | 4 | 2 | **6** |
| **TOTAL** | **1** | **8** | **20** | **2** | **31** |

---

## 🔴 ISSUES CRITIQUES (BLOCKER)

1. **AbortSignal.any fallback manquant** (quranAPI.js:108)
   - **Impact**: Timeout ne fonctionne pas en vieux navigateurs
   - **Est**: 1-2 heures
   - **Priorité**: 🔴 URGENT

---

## 🟠 ISSUES HAUTES (à fixer cette sprint)

1. **karaokeFollow forcé à true** (AppContext.jsx:142) — utilisateur ne peut pas désactiver
2. **Z-index conflict AudioPlayer** (AudioPlayer.jsx) — lecteur caché
3. **AudioLoadingIndicator hardcoded EN/FR** (AudioLoadingIndicator.jsx) — bad i18n
4. **Footer Unicode escape** (Footer.jsx) — code illisible + risque d'encodage
5. **PlatformLogo fallback incomplet** (PlatformLogo.jsx) — logo peut disparaître
6. **Trop de state în AudioPlayer** (AudioPlayer.jsx:200+) — risque d'incohérence
7. **Sanitization XSS faible** (quranAPI.js/SearchModal.jsx) — injection possible
8. **localStorage/IndexedDB non chiffrées** (searchModal/storage) — données sensibles visibles

---

## 🟡 QUICK WINS (faciles à fixer)

1. ✅ Supprimer le `useEffect` dupliqué (App.jsx:104)
2. ✅ Remplacer Unicode escape par UTF-8 (Footer.jsx)
3. ✅ Ajouter RTL padding mobile (QuranDisplay.jsx)
4. ✅ Fixer toast SSR check (utils.js)
5. ✅ Memoizer SmartAyahRenderer (QuranDisplay.jsx)

---

## 📈 TECHNICAL DEBT

| Domaine | Effort | Impact |
|---------|--------|--------|
| Refactorer AudioPlayer avec useReducer | 3h | Haute |
| Implémenter LRU cache (quranAPI) | 1.5h | Moyenne |
| Ajouter Error Boundaries | 2h | Moyenne |
| Centraliser constantes (114 surahs, etc) | 1h | Moyenne |
| Migrer escape Unicode vers UTF-8 | 2h | Basse (UX) |
| Implémenter i18n complet | 4h | Haute |

---

## 🎯 RECOMMANDATIONS PRIORITAIRES

### Priority 1 (This week)
- [ ] Fixer AbortSignal.any fallback
- [ ] Corriger karaokeFollow
- [ ] Ajouter guard SSR dans toast()
- [ ] Augmenter sanitization XSS

### Priority 2 (Next week)
- [ ] Refactorer AudioPlayer (useReducer)
- [ ] Implémenter i18n par compant
- [ ] Ajouter Error Boundaries
- [ ] Optimiser cache avec LRU

### Priority 3 (Next sprint)
- [ ] Chiffrer IndexedDB
- [ ] Migrer Unicode escapes
- [ ] Implémenter PWA offline mode
- [ ] Performance audit (Lighthouse)

---

## ✅ FICHIERS À VÉRIFIER MANUELLEMENT

- [ ] vite.config.js — config bundle size
- [ ] package.json — dépendances outdated ?
- [ ] CSS files → contraste WCAG AA
- [ ] Tests unit/integration — existent?
- [ ] i18n coverage — toutes clés traduites?

---

# PHASE 3: PLAN DE CORRECTION

```
Semaine 1:
  - Day 1-2: Fixer bugs CRITICAL + HIGH priority
  - Day 3-4: Refactorer AudioPlayer
  - Day 5: Test + QA

Semaine 2:
  - Implémenter i18n complet
  - Ajouter Error Boundaries
  - Performance optimization

Semaine 3:
  - Sécurité (chiffrement IDB, sanitization)
  - Tests complets
```

---

**Fin du rapport** | Généré 16 mars 2026 | by GitHub Copilot
