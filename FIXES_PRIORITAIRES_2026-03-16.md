# 🔧 GUIDE DE CORRECTION PRIORITAIRE
**Target**: Les 8 bugs HIGH + les CRITICAL | **Temps estimé**: 6-8 heures

---

## 🔴 BUG #1: AbortSignal.any Fallback manquant

**Fichier**: `src/services/quranAPI.js`  
**Ligne**: 108-125  
**Sévérité**: 🔴 CRITICAL  
**Impact**: Timeout ne fonctionne pas; API peut hang indéfiniment sur vieux navigateurs

### Solution:

```javascript
// Ajouter cette fonction helper avant fetchJSON()
function combineAbortSignals(navigationSignal, timeoutSignal) {
  if (!navigationSignal && !timeoutSignal) return null;
  if (!navigationSignal) return timeoutSignal;
  if (!timeoutSignal) return navigationSignal;
  if (!AbortSignal.any) {
    // Fallback pour navigateurs non-modernes
    const combined = new AbortController();
    navigationSignal.addEventListener('abort', () => combined.abort(), { once: true });
    timeoutSignal.addEventListener('abort', () => combined.abort(), { once: true });
    return combined.signal;
  }
  // Modern path
  return AbortSignal.any([navigationSignal, timeoutSignal]);
}

// Puis remplacer à la ligne 108:
const combinedSignal = combineAbortSignals(signal, timeoutCtrl.signal);
```

---

## 🟠 BUG #2: karaokeFollow forcé à true

**Fichier**: `src/context/AppContext.jsx`  
**Ligne**: 142  
**Sévérité**: 🟠 HIGH  
**Impact**: Utilisateur ne peut pas désactiver le karaoke mode

### Solution:

```javascript
// Remplacer le reducer "SET" case (ligne ~133-150):
case "SET": {
  const payload = action.payload || {};
  const next = { ...state, ...payload };
  if (Object.prototype.hasOwnProperty.call(payload, "theme")) {
    next.theme = normalizeThemeId(payload.theme, state.theme);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "dayTheme")) {
    next.dayTheme = normalizeDayTheme(payload.dayTheme);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "nightTheme")) {
    next.nightTheme = normalizeNightTheme(payload.nightTheme);
  }
  // FIX: Permettre au user de désactiver karaoke, sauf si audio nécessite
  // (commentaire explique pourquoi c'était forcé)
  if (!Object.prototype.hasOwnProperty.call(payload, "karaokeFollow")) {
    // Si pas fourni dans payload, garder la valeur existante (ou false par défaut)
    next.karaokeFollow = state.karaokeFollow ?? false;
  }
  // N'ENLEVEZ PAS LA LIGNE: // next.karaokeFollow = true; // Desormais remplacée
  return next;
}
```

---

## 🟠 BUG #3: AudioLoadingIndicator labels hard-codés

**Fichier**: `src/components/AudioLoadingIndicator.jsx`  
**Ligne**: 1-50  
**Sévérité**: 🟠 HIGH  
**Impact**: Mauvaise i18n; utilisateurs anglais/arabes voient mélange FR/EN

### Solution:

```jsx
import React from "react";
import { t } from "../i18n";
import { cn } from "../lib/utils";

/**
 * AudioLoadingIndicator — Affiche le statut de chargement du lecteur audio
 * Supporte: loading, buffering, playing, paused, error, ready
 */
export default function AudioLoadingIndicator({
  state = "ready",
  isPlaying = false,
  errorMessage = null,
  lang = "fr", // 👈 AJOUTER
}) {
  if (state === "ready" && !isPlaying) return null;

  const getIcon = () => {
    // [code inchangé...]
  };

  const getLabel = () => {
    switch (state) {
      case "loading":
        return t("audio.loading", lang); // Avant: "Chargement..."
      case "buffering":
        return t("audio.buffering", lang); // Avant: "Buffering..."
      case "error":
        return t("audio.error", lang); // Avant: "Erreur"
      case "playing":
        return isPlaying ? t("audio.playing", lang) : t("audio.ready", lang);
      default:
        return "";
    }
  };

  // [code inchangé pour getColor...]

  return (
    <div
      className={cn(
        "audio-loading-indicator flex items-center gap-2 text-xs font-medium",
        getColor(),
      )}
    >
      {getIcon()}
      <span>{getLabel()}</span>
      {errorMessage && state === "error" && (
        <span className="text-red-600 text-[11px] ml-1" title={errorMessage}>
          - {errorMessage.substring(0, 30)}...
        </span>
      )}
    </div>
  );
}

// Ajouter à i18n/fr.js:
export default {
  // ... existing
  audio: {
    loading: "Chargement...",
    buffering: "Buffering...",
    error: "Erreur",
    playing: "En lecture",
    ready: "Prêt",
  },
};

// Ajouter à i18n/en.js:
export default {
  audio: {
    loading: "Loading...",
    buffering: "Buffering...",
    error: "Error",
    playing: "Playing",
    ready: "Ready",
  },
};

// Ajouter à i18n/ar.js:
export default {
  audio: {
    loading: "جاري التحميل...",
    buffering: "التخزين المؤقت...",
    error: "خطأ",
    playing: "قيد التشغيل",
    ready: "جاهز",
  },
};
```

---

## 🟠 BUG #4: Footer Unicode Escapes

**Fichier**: `src/components/Footer.jsx`  
**Ligne**: 15-35  
**Sévérité**: 🟠 HIGH (UX de maintenance)  
**Impact**: Code illisible + risque de corruption UTF-8

### Solution — 2 approches:

### Approche A: Remplacer inline (rapide)

```jsx
const STARTER_SURAHS = [
  {
    n: 1,
    ar: "الفاتحة",
    fr: "Al-Fatiha",
    en: "The Opening",
    ayat: 7,
  },
  {
    n: 18,
    ar: "الكهف",
    fr: "Al-Kahf",
    en: "The Cave",
    ayat: 110,
  },
  // ... (remplacer tous UNICODE_ESCAPES)
];
```

### Approche B: Extraire dans data/ (meilleur)

**Fichier**: `src/data/surah-metadata-ui.js` (NOUVEAU)

```javascript
export const STARTER_SURAHS = [
  { n: 1, ar: "الفاتحة", fr: "Al-Fatiha", en: "The Opening", ayat: 7 },
  { n: 18, ar: "الكهف", fr: "Al-Kahf", en: "The Cave", ayat: 110 },
  // ...
];

export const EXPERIENCE_PILLS = [
  { icon: "fa-palette", fr: "Tajwid coloré", en: "Color tajweed", ar: "تجويد ملون" },
  // ...
];
```

Puis dans Footer.jsx:

```jsx
import { STARTER_SURAHS } from "../data/surah-metadata-ui";
```

---

## 🟠 BUG #5: Z-Index AudioPlayer

**Fichier**: `src/components/AudioPlayer.jsx`  
**Ligne**: ~425  
**Sévérité**: 🟠 HIGH  
**Impact**: Lecteur audio peut être caché sous header/modals

### Solution:

Trouver la ligne du JSX principal (généralement la div `.card-player` ou `.audio-player`):

```jsx
// Avant:
<div className="card-player shadow-lg rounded-2xl ring-1 ring-white/20">

// Après:
<div className="card-player shadow-lg rounded-2xl ring-1 ring-white/20 z-40">
```

**Note**: Vérifier l'ordre de z-index global:
- Header: `z-30`
- Modals: `z-50`
- AudioPlayer: `z-40` ✅ (entre les deux)

---

## 🟠 BUG #6: PlatformLogo Fallback incomplet

**Fichier**: `src/components/PlatformLogo.jsx`  
**Sévérité**: 🟠 HIGH  
**Impact**: Logo disparaît si 2 sources échouent; UX confuse

### Solution:

```jsx
import React, { useState } from "react";

const PRIMARY_LOGO_SRC = "/logo.png";
const FALLBACK_LOGO_SRC = "/favicon.svg";
const EMOJI_FALLBACK = "📖"; // Emoji Quran

export default function PlatformLogo({
  className = "",
  imgClassName = "",
  alt = "MushafPlus",
  decorative = false,
}) {
  const [src, setSrc] = useState(PRIMARY_LOGO_SRC);
  const [loadFailed, setLoadFailed] = useState(false);

  const handleError = () => {
    if (src === PRIMARY_LOGO_SRC) {
      setSrc(FALLBACK_LOGO_SRC);
    } else if (!loadFailed) {
      setLoadFailed(true); // Marquer comme complètement échoué
    }
  };

  if (loadFailed) {
    // Emoji fallback
    return (
      <span 
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
        }}
        aria-hidden={decorative ? "true" : undefined}
        title={alt}
      >
        {EMOJI_FALLBACK}
      </span>
    );
  }

  return (
    <span className={className} aria-hidden={decorative ? "true" : undefined}>
      <img
        src={src}
        alt={decorative ? "" : alt}
        className={imgClassName}
        loading="eager"
        decoding="async"
        onError={handleError}
      />
    </span>
  );
}
```

---

## 🟡 BUG #7: Dupliqué useEffect (App.jsx)

**Fichier**: `src/App.jsx`  
**Ligne**: 104-107 et ~113-118  
**Sévérité**: 🟡 MEDIUM  
**Impact**: Code dupliqué, confusion sémantique

### Solution:

Remplacer les 2 `useEffect` par 1 seul:

```jsx
// ❌ AVANT (Lignes 104-107):
useEffect(() => {
  document.documentElement.style.setProperty("--reading-progress", "0");
}, []);

// ❌ AUSSI AVANT (Lignes ~113-118):
useEffect(() => {
  document.documentElement.style.setProperty("--reading-progress", "0");
}, [currentSurah, currentJuz, currentPage, displayMode]);

// ✅ APRÈS (Remplacer TOUT par):
useEffect(() => {
  document.documentElement.style.setProperty("--reading-progress", "0");
}, [currentSurah, currentJuz, currentPage, displayMode]);
```

---

## 🟡 BUG #8: toast() SSR check manquant

**Fichier**: `src/lib/utils.js`  
**Sévérité**: 🟡 MEDIUM  
**Impact**: Si SSR, crash sur `window` undefined

### Solution:

```javascript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * toast(message, type?) — dispatch a global toast notification.
 * Listens for 'quran-toast' CustomEvent in App.jsx.
 */
export function toast(message, type = "info") {
  // 👈 AJOUTER Cette check:
  if (typeof window === "undefined") return;
  
  window.dispatchEvent(
    new CustomEvent("quran-toast", { detail: { message, type } }),
  );
}
```

---

# 📋 CHECKLIST IMPLÉMENTATION

```
Bugs HIGH (🟠):
  ☐ #1 AbortSignal.any (2h)
  ☐ #2 karaokeFollow fix (30min)
  ☐ #3 AudioLoadingIndicator i18n (1h)
  ☐ #4 Footer Unicode → UTF-8 (1h)
  ☐ #5 AudioPlayer z-index (15min)
  ☐ #6 PlatformLogo fallback (1h)

Bugs MEDIUM (🟡):
  ☐ #7 Dupliqué useEffect (15min)
  ☐#8 toast SSR check (10min)

TOTAL: ~7 heures

QA:
  ☐ Test sur vieux navigateurs (IE11 emulation)
  ☐ Test audio playback
  ☐ Test i18n (FR/EN/AR)
  ☐ Lighthouse audit
```

---

**Document généré**: 16 mars 2026 | by GitHub Copilot
