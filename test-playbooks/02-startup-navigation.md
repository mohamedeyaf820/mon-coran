# Playbook 02 — Startup & Navigation

**Environment:** `npm run dev` or production build, Chrome/Firefox latest, DevTools open
**Automated equivalent:** `npm run test:e2e:smoke`

---

## 2.1 SplashScreen

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 2.1.1 | Splash dismisses in ≤ 750 ms on fast connection | Hard-reload, Performance tab — measure splash-to-home time | | | |
| 2.1.2 | Skip button appears at ≤ 400 ms | Hard-reload, watch for Skip button timing | | | |
| 2.1.3 | Skip button bypasses remainder of delay | Click Skip immediately — home renders | | | |
| 2.1.4 | No double-flash (splash shown only once) | Hard-reload, no second white flash after home renders | | | |

---

## 2.2 Home screen

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 2.2.1 | Surahs tab loads list | Click Surahs tab — 114 rows visible | | | |
| 2.2.2 | Juz tab loads list | Click Juz — 30 items | | | |
| 2.2.3 | Recitations tab loads | Click Recitations — reciter cards visible | | | |
| 2.2.4 | Radio tab loads | Click Radio — station cards visible | | | |
| 2.2.5 | Tab keyboard navigation (arrow keys) | Focus first tab, press →/← — selection moves | | | |

---

## 2.3 Surah navigation

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 2.3.1 | Click surah → reader opens | Click Al-Fatiha — reader shows surah 1 | | | |
| 2.3.2 | Next / Previous surah | Press `→` / `←` in reader — surah changes | | | |
| 2.3.3 | URL updates on navigation | Address bar reflects new surah/ayah | | | |
| 2.3.4 | Browser back/forward works | Navigate forward, press Back — returns to previous surah | | | |

---

## 2.4 Keyboard shortcuts

| # | Scenario | Keys | Expected | Observe | Verdict | Issue |
|---|----------|------|----------|---------|---------|-------|
| 2.4.1 | Show shortcuts overlay | `?` | Shortcuts panel opens | | | |
| 2.4.2 | Toggle translation | `T` | Translation toggles | | | |
| 2.4.3 | Toggle Word-by-Word | `W` | WbW panel toggles | | | |
| 2.4.4 | Toggle Tajweed | `J` | Tajweed colors toggle | | | |
| 2.4.5 | Toggle Memorization | `M` | Memorization mode toggles | | | |
| 2.4.6 | Open search | `/` | Search modal opens | | | |
| 2.4.7 | Open settings | `,` | Settings modal opens | | | |
| 2.4.8 | Close modal with Escape | Open any modal, press `Escape` | Modal closes | | | |
| 2.4.9 | Play/Pause | `Space` | Playback toggles | | | |

---

## 2.5 Sidebar

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 2.5.1 | Sidebar opens/closes | Click hamburger icon | Sidebar slides in/out | | | |
| 2.5.2 | Sidebar keyboard-navigable | Tab through sidebar items | All links reachable by keyboard | | | |
| 2.5.3 | Sidebar closes on overlay click | Click outside sidebar | Sidebar closes | | | |
