# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MushafPlus is a feature-rich Quran reading web application (PWA) built as a pure static SPA with React 18 + Vite. It supports dual riwaya (Hafs & Warsh), trilingual UI (French/English/Arabic with RTL), audio playback from multiple CDNs, tajweed display, memorization tools, and offline usage via service worker.

## Commands

```bash
npm run dev           # Start dev server (port 3002)
npm run build         # Production build + CSS purge + performance audit
npm run build:ci      # build + bundle budget check (CI gate)
npm run preview       # Preview production build (port 4173)

# Tests
npm run test:security             # Node.js unit tests (storage, audio, reciters, tafsir)
npm run test:e2e                  # Full Playwright E2E suite
npm run test:e2e:smoke            # Quick smoke: audio fallback + a11y
npm run test:e2e:reading          # Reading scroll + stability tests
npm run test:e2e:responsive       # Responsive density tests
npm run qa:smoke                  # Combined: smoke + reading + security tests

# Single E2E test
npx playwright test tests/e2e/audio-fallback.spec.mjs

# Audits
npm run perf:budget               # Check bundle size budgets
npm run audit:screen-budget       # Check screen UX budgets
npm run audit:warsh:audio         # Verify Warsh audio sources
npm run audit:warsh:tajweed       # Verify Warsh tajweed data
```

E2E tests require a production build first (`npm run build`) — Playwright uses `vite preview` on port 4173.

## Architecture

### State Management
Single `AppContext` (`src/context/AppContext.jsx`) using `useReducer` with a custom selector pattern (`useAppSelector` + `shallowEqual`). State is persisted to localStorage via `storageService`. No external state library (no Redux/Zustand).

### Data Flow for Quran Text
1. `quranAPI.js` — primary text fetcher (AlQuran Cloud API + Quran.com API)
2. `quranComAPI.js` — Quran.com-specific endpoints (text, translations, word-by-word)
3. `warshService.js` — dedicated Warsh riwaya text from local JSON data
4. All API responses cached in-memory (Map with size limit) and in IndexedDB (`dbService.js`)

### Audio Architecture
- `audioService.js` — singleton wrapping HTML5 Audio with retry, preload, timeout, and URL validation (allowlist of trusted CDN hosts)
- Supports ayah-by-ayah and full-surah streaming (mp3quran CDN)
- `quranComAudioTimingService.js` — word-level timing for karaoke mode
- `audioPlaylist.js` (utility) builds playlists per surah/reciter

### Display Modes
Three reading modes in `src/components/QuranDisplay/`:
- **Surah** mode — continuous scroll per surah
- **Page** mode — Mushaf page layout (604 pages)
- **Juz** mode — 30 juz divisions

Layout variants: `list` (default) and `mushaf` (page-accurate typeset)

### i18n
Lightweight system in `src/i18n/` — `t(key, lang)` function with fallback chain (fr → en → ar). Three locale files: `fr.js`, `en.js`, `ar.js`.

### Styling
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin, no config file — uses `@import "tailwindcss"`)
- Domain-specific CSS in `src/styles/domains/` (themes, mobile, premium features)
- Functional CSS layers in `src/styles/` (responsive, dark mode, reading UX)
- CSS custom properties for theming (`--primary`, `--bg-card`, `--text-primary`, etc.)

### Key Services (src/services/)
- `storageService.js` / `dbService.js` — localStorage + IndexedDB persistence
- `fontLoader.js` / `qcf4PageFontService.js` — dynamic Arabic font loading
- `historyService.js` / `readingStreakService.js` — reading progress tracking
- `memorizationService.js` — spaced repetition for memorization mode
- `tafsirService.js` — Quran commentary/exegesis fetching
- `cryptoUtil.js` — AES encryption for sensitive local data

### Bundle Strategy
- Aggressive code splitting: all panels/modals are `React.lazy()` loaded
- Manual chunks are limited to React, CryptoJS and idb; route and modal chunks remain lazy and content-driven
- Lucide icons are tree-shaken; the home icon adapter avoids loading a global icon font
- Production JavaScript is minified by Rolldown/Oxc with console and debugger removal
- Bundle and source-screen budgets are enforced by `npm run build:ci`
- Current default ceilings: CSS 890 KiB, JS 1275 KiB, initial payload 810 KiB and initial gzip 200 KiB

### CSP (Content Security Policy)
Injected at build time via `scripts/cspPolicy.mjs` — template in `index.html` uses `__CSP_POLICY__` placeholder. Audio sources restricted to allowlisted CDN domains.

## Conventions

- Language: UI strings in French by default, all code comments acceptable in French
- Components: JSX files, functional components only, hooks for logic extraction
- Arabic text handling: RTL layout switches based on `lang === "ar"`, `dir` attribute on root
- Riwaya-aware: many components branch on `riwaya === "warsh"` for font/data differences
- Performance-sensitive: `detectLowPerformanceDevice()` gates animations and preloads; `runWhenIdle()` defers non-critical work
- URL sync: `useUrlSync` keeps semantic paths (`/surah`, `/page`, `/juz`, legal pages) synchronized for deep linking
