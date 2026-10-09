# Surface routing

Use this map to load the narrowest relevant implementation and tests. Verify paths because the repository evolves.

| Surface | Primary code | Load with |
| --- | --- | --- |
| App shell and navigation | `src/App.jsx`, `src/components/Header.jsx`, `Sidebar.jsx`, `Footer.jsx`, `src/hooks/useUrlSync.js` | interface quality, copy, resilience |
| Home and discovery | `src/components/HomePage.jsx`, `src/components/Home/` | interface quality, copy, patterns |
| Quran reading | `src/components/QuranDisplay.jsx`, `src/components/Quran/`, `src/components/QuranDisplay/` | product judgment, interface quality, resilience, rules |
| Audio and reciters | `src/components/AudioPlayer.jsx`, `src/components/audioPlayer/`, `src/components/recitation/`, audio services | product judgment, resilience, copy |
| Search | `src/components/SearchModal.jsx`, search hooks/utilities/workers | patterns, copy, resilience |
| Settings | `src/components/SettingsModal.jsx`, `src/components/settings/`, context/storage | product judgment, patterns, copy |
| Library and memorization | `src/components/LibraryModal.jsx`, memorization/history/local-data services | product judgment, resilience, privacy copy |
| Ayah actions and sharing | `src/components/AyahActions.jsx`, `AyahSharePanel.jsx`, `QuranDisplay/AyahActionsModal.jsx` | product judgment, patterns, copy |
| Tafsir and duas | `src/components/TafsirSidebar.jsx`, `DuasPage.jsx`, tafsir services | interface quality, copy, resilience |
| PWA and offline | `src/components/NetworkStatus.jsx`, `PWAUpdateBanner.jsx`, `public/sw.js`, storage/download services | resilience, copy, rules |
| Legal and privacy | `src/components/LegalPage.jsx`, `PrivacyLockGate.jsx`, `PRIVACY.md`, `docs/SECURITY_PRIVACY.md` | product judgment, copy, resilience |

## Cross-surface owners

- UI language: `src/i18n/`
- reusable primitives: `src/components/ui/`
- themes and tokens: `src/styles/`
- state and persistence: `src/context/`, `src/services/storageService.js`, `src/services/dbService.js`
- product architecture: `ARCHITECTURE.md`
- visible quality: `docs/DESIGN_SYSTEM.md`, Playwright tests, and rendered screenshots
- source budgets: `SCREEN_UX_BUDGETS.md`
