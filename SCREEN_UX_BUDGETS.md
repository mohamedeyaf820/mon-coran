# Screen UX Budget Plan

This plan defines per-screen source budgets to keep UI/UX iteration safe.

## Budgets

- Home: `src/components/HomePage.jsx` <= 90 kB
- Quran Display: `src/components/QuranDisplay.jsx` <= 95 kB
- Audio Player: `src/components/AudioPlayer.jsx` <= 140 kB
- Settings: `src/components/SettingsModal.jsx` <= 160 kB
- Welcome page (`/`): `src/components/landing/LandingPage.jsx` <= 12 kB

## UX Pass Checklist by Screen

### Home
- Keep recitations and radio controls visually consistent.
- Preserve single scroll behavior on mobile lists.
- Keep main action hierarchy (read, continue, duas) clear.

### Welcome page (`/`)
- Three entries only (read, invocations, listen) plus the mobile block; no prayers, search or settings.
- The main action continues the saved reading (`Continuer · sourate v.N`) before offering `Commencer la lecture`.
- No store address is invented: `site.config.json` `mobileApp.androidUrl` / `iosUrl` stay empty until a public https link exists, and the page says `Bientôt sur Android et iOS`.
- The app home lives at `/accueil` (also `/en/accueil`, `/ar/accueil`); it is prerendered noindex with the language home as canonical.

### QuranDisplay
- Ensure ayah click-to-play always works from empty playlist.
- Keep word-by-word fallback behavior stable.
- Preserve readability in all display modes.

### AudioPlayer
- Keep options modal compact and readable on mobile.
- Preserve transport controls discoverability.

### Settings
- Keep modal compact by viewport category.
- Preserve tab usability and contrast.

## Validation

Run:

- `npm.cmd run audit:screen-budget`
- `npm.cmd run build:ci`
- `npm.cmd run test:security`
