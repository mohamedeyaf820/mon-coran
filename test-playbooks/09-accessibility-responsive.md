# Playbook 09 — Accessibility & Responsive

**Environment:** Chrome latest + NVDA (Windows) or VoiceOver (macOS/iOS), DevTools device emulation
**Automated equivalent:** `npm run test:e2e:a11y`, `npm run test:e2e:responsive`

---

## 9.1 Keyboard-only navigation

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 9.1.1 | Tab reaches all interactive elements | Tab through entire page — no element skipped | | | |
| 9.1.2 | Focus indicator visible | Tab through — every focused element has visible ring | | | |
| 9.1.3 | Modals trap focus | Open any modal, Tab — focus stays inside modal | | | |
| 9.1.4 | Skip link reachable | First Tab from top — "Skip to content" link visible | | | |
| 9.1.5 | All buttons have accessible labels | Tab to icon-only buttons — screen reader announces name | | | |

---

## 9.2 Screen reader (NVDA + Chrome / VoiceOver + Safari)

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 9.2.1 | Page title meaningful | Navigate to surah reader — `<title>` announces surah name | | | |
| 9.2.2 | Ayah list has proper ARIA | SR reads ayah number + text | | | |
| 9.2.3 | Live region announces playback changes | Start audio — "Playing Surah X" announced | | | |
| 9.2.4 | Search results count announced | Type in search — count announced via aria-live | | | |
| 9.2.5 | Tabs announce role and selection | Focus home tab bar — "tab, 1 of 4, selected" | | | |
| 9.2.6 | Dialog title announced on open | Open Settings — "Settings dialog" announced | | | |
| 9.2.7 | Arabic text language tagged | Arabic ayah text — SR switches to Arabic voice | | | |

---

## 9.3 Color contrast

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 9.3.1 | Body text WCAG AA (4.5:1) | DevTools → Accessibility → Contrast | All body text ≥ 4.5:1 | | | |
| 9.3.2 | Dark mode contrast maintained | Switch dark, re-check | Same pass rate | | | |
| 9.3.3 | Sepia theme contrast maintained | Switch sepia, re-check | Same pass rate | | | |
| 9.3.4 | Tajweed colors pass 3:1 on background | Enable Tajweed | No tajweed color fails 3:1 large-text rule | | | |

---

## 9.4 Touch targets

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 9.4.1 | Audio player buttons ≥ 44px | DevTools → Elements → computed size of play button | ≥ 44 × 44 px | | | |
| 9.4.2 | Ayah action icons ≥ 44px | Computed size of bookmark/share icons | ≥ 44 × 44 px | | | |
| 9.4.3 | Footer nav items ≥ 44px | Footer tab size | ≥ 44 × 44 px | | | |
| 9.4.4 | MiniPlayer controls ≥ 44px | MiniPlayer play/prev/next buttons | ≥ 44 × 44 px | | | |

---

## 9.5 RTL layout (Arabic language)

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 9.5.1 | `dir="rtl"` on `<html>` | Set lang AR, DevTools — check `<html dir>` | `dir="rtl"` set | | | |
| 9.5.2 | Layout mirrors correctly | Set lang AR — nav, sidebar, modals mirror | | | |
| 9.5.3 | Icons flip as expected | Chevron icons point opposite direction in RTL | | | |
| 9.5.4 | Text alignment correct | All Arabic text right-aligned, Latin text left-aligned | | | |

---

## 9.6 Responsive breakpoints

| # | Scenario | Viewport | Observe | Verdict | Issue |
|---|----------|----------|---------|---------|-------|
| 9.6.1 | Mobile 375 × 812 (iPhone 14) | Emulate iPhone 14 | No horizontal scroll, all content visible | | | |
| 9.6.2 | Tablet 768 × 1024 | Emulate iPad | Layout comfortable, no overflow | | | |
| 9.6.3 | Desktop 1280 × 800 | Resize to 1280 px | Full desktop layout shown | | | |
| 9.6.4 | Footer nav visible on mobile | 375 px — footer tabs visible above home bar | | | |
| 9.6.5 | MiniPlayer safe area on notched phone | iPhone 14 Pro — MiniPlayer above home bar | | | |
| 9.6.6 | Dark mode via `prefers-color-scheme` | OS dark mode on — app loads in dark | | | |
| 9.6.7 | Density adapts on small screens | 375 px — text/spacing reduced appropriately | | | |
