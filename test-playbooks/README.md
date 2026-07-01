# mon-coran — QA Playbooks

Manual and semi-manual test campaigns that complement the automated suite
(`npm run test:security`, `npm run test:e2e`).

## Structure

| File | Area |
|------|------|
| `01-technical-gates.md` | Build, budgets, CI, security headers |
| `02-startup-navigation.md` | Splash, routing, keyboard shortcuts |
| `03-quran-reading.md` | Surah/page/juz modes, Tajweed, Warsh |
| `04-search.md` | Search modal, reciter search |
| `05-audio.md` | Playback, MiniPlayer, MediaSession |
| `06-study-memorization.md` | Memorization mode, Word-by-Word, Karaoke |
| `07-persistence.md` | LocalStorage, bookmarks, history |
| `08-pwa-security.md` | Install prompt, offline, CSP, HTTPS |
| `09-accessibility-responsive.md` | a11y, RTL, keyboard-only, mobile |

## Verdict key

| Symbol | Meaning |
|--------|---------|
| ✅ | Pass |
| ❌ | Fail |
| ⚠️ | Partial / degraded |
| ⏭️ | Skipped / not applicable |

## How to use

1. Pick a playbook.
2. Set up the environment noted at the top.
3. Work through each scenario row-by-row.
4. Fill **Observe** with what actually happened.
5. Set **Verdict** from the key above.
6. Put a GitHub issue link in **Issue** when verdict ≠ ✅.
