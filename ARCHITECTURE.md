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

#### Background and lock-screen playback

`audioService.js` keeps one main native media element for the lifetime of the
page. React observes it; navigation and component cleanup do not stop it.

- **Native progression.** `ended` advances the playlist through the same
  asynchronous loader as explicit playback. An `ended` event does not grant
  user activation. Rejected autoplay is reported as an interruption.
- **Actual media state.** `_playbackIntent` distinguishes a requested pause from
  a detectable interruption; `isPlaying` and Media Session reflect the native
  element. Visibility, `resume` and connection changes reconcile state without
  restarting audio. Resuming an interrupted source requires a user/media action.
- **Engine-owned controls.** `engineMediaSession.js` binds system actions and
  metadata independently of React. `audioSession.js` feature-detects the native
  playback category and observes native pause/playing events. Sources and
  pending commands are guarded against stale asynchronous completions.
- **Verified local sources.** `offlineAudioStore.js` validates readable complete
  MPEG Layer III bodies in the stable `mushafplus-audio-v2` Cache Storage cache.
  The engine uses local Blob URLs first, including without a service worker.
  `downloadService.js` verifies actual files, repairs legacy progress metadata,
  handles quotas/cancellation and preserves the cache across shell updates.
- **Riwaya integrity.** Existing Hafs/Warsh file mappings remain authoritative.
  The current catalogue uses per-file recitation. Legacy full-surah streams can
  play, but have no estimated verse synchronization or verse seeking without
  trustworthy timestamps. Quran.com per-verse word timings are separate.
- **Distinct audio purposes.** Preload elements never play. Word pronunciation
  and adhan retain their own elements; word playback claims focus and pauses
  the main recitation. Only the main engine owns Media Session.
- **Platform limits.** A full adhan cannot be started by an installed PWA that
  is closed or in the background: Web Push has no audio payload and autoplay
  policy forbids a page-less `play()`. The adhan is therefore a foreground
  action and the reminder is the OS notification.

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
- `fontLoader.js` — dynamic Arabic font loading, including the per-page QCF4
  faces (`ensureFontLoaded`, `ensureQcfPageFontLoaded`); the QCF page font
  resolver lives there and not in a second service
- `storageService.js` also owns `lastPosition` (resume-reading). The reader
  keeps that position and records no progression metrics at all — no
  per-surah "highest ayah read", no session history — so there is neither a
  `historyService.js` nor a `readingProgressService.js`
- Prayer tracking keys one local day as `YYYY-M-D` with a **0-based** month
  (`Date#getMonth()`), so `2026-0-15` is 15 January. `localDayKey` in
  `prayerTimesService.js` and `prayerLogService.js` write that shape and
  `prayerLogService.dayKeyToDate` is the only decoder: reading a key back as
  if the month were 1-based dates it a month early, which un-suppresses a
  reminder the reader had already answered and rolls their log off retention
  about a month too soon
- Recitation repetition (A-B loop, per-surah cycles) is part of `audioService.js`;
  there is no spaced-repetition service
- `audioService.js` owns the single `<audio>` element and the playlist. The
  background-playback pieces sit beside it to keep that file inside its screen
  budget: `audioSession.js` (native playback observation),
  `engineMediaSession.js` (system controls), `offlineAudioStore.js` (verified local
  media), `audioHandoff.js` (native verse-boundary progression), `audioPreload.js`,
  `reciterLatency.js` and `audioEq.js`
- `quranComStudyService.js` — Quran commentary/exegesis fetching and the tafsir
  source registry (`TAFSIR_RESOURCES`); `frenchTafsirService.js` serves the
  Al-Mukhtasar commentary (QuranEnc.com API, key `french_mokhtasar`, Tafsir Center
  for Quranic Studies) one surah per request, validated for completeness and kept
  in IndexedDB so a surah already read reopens offline; no file is vendored. There is no separate `tafsirService.js`
- `cryptoUtil.js` — AES encryption for sensitive local data

### Bundle Strategy
- Aggressive code splitting: all panels/modals are `React.lazy()` loaded
- Manual chunks are limited to React, CryptoJS and idb; route and modal chunks remain lazy and content-driven
- Lucide icons are tree-shaken; the home icon adapter avoids loading a global icon font
- Production JavaScript is minified by Rolldown/Oxc with console and debugger removal
- Bundle and source-screen budgets are enforced by `npm run build:ci`
- Current default ceilings: CSS 890 KiB, JS 1275 KiB, initial payload 810 KiB and initial gzip 200 KiB

### CSP (Content Security Policy)
Injected at build time via `scripts/cspPolicy.mjs` — template in `index.html` uses `__CSP_POLICY__` placeholder. Audio sources restricted to allowlisted CDN domains. `media-src` lists exactly the hosts the player validates in `audioSources.js` plus the adhan recording host, so a new audio host is added to both or it fails silently in production; `cdn.jsdelivr.net` appears in `font-src`/`connect-src` only (QCF4 page fonts) and must not be added to `media-src`. `vercel.json` and `netlify.toml` carry a copy of the same policy and are updated with it.

## Conventions

- Language: UI strings in French by default, all code comments acceptable in French
- Components: JSX files, functional components only, hooks for logic extraction
- Arabic text handling: RTL layout switches based on `lang === "ar"`, `dir` attribute on root
- Riwaya-aware: many components branch on `riwaya === "warsh"` for font/data differences
- Performance-sensitive: `detectLowPerformanceDevice()` gates animations and preloads; `runWhenIdle()` defers non-critical work
- URL sync: `useUrlSync` keeps semantic paths (`/surah`, `/page`, `/juz`, legal pages) synchronized for deep linking
