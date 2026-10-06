# Mushaf Plus Design System Notes

Status: living internal guide.

## Principles

- Keep the reading surface calm before everything else. The Quran text must remain the visual priority.
- Prefer one clear primary action per surface. Secondary actions should move into compact menus on mobile.
- Use dense controls only when they remain touch-safe: 44px minimum target on mobile and tablet.
- Avoid decorative effects that reduce contrast, especially in dark mode and over Arabic text.
- Keep RTL behavior native. Do not fake Arabic alignment with visual-only transforms.

## Layout Tokens

- App shell: fixed header on desktop; phone and tablet omit the global header and reserve no header height. Main content scrolls independently, with audio height reserved through `--player-h`.
- Phone and tablet navigation: four fixed destinations plus an on-demand More menu reserve `--mobile-nav-h`; Hafs/Warsh selection, search, settings, surah directory, library and duas live in this menu. The audio dock sits above this band. On phone and tablet reading surfaces, the audio dock and navigation hide after 2.8 seconds of inactivity or during downward scrolling, including during playback. A tap in the reading area or keyboard navigation reveals the controls. Dialogs and keyboard focus in the controls keep them available; hiding does not stop audio or reset reading position. On the other pages (home, prayers, duas and the four information pages) the header stays, and only the bottom bar follows the gesture: it slides away after about 48 px of downward scrolling, stays at the top of a page, and a tap on the page, a key press (Tab, Escape, Home, PageUp, ArrowUp) or a change of page brings it back (`navAway` in `App.jsx`, `.app-root.nav-away` in `shell-calm.css`).
- Reading width: use viewport-aware max widths, then allow the Arabic block to breathe inside list and mushaf modes.
- Mobile spacing: outer padding should stay between 12px and 16px; use horizontal scrolling toolbars instead of wrapping controls into tall stacks.
- Tablet spacing: prefer two balanced columns only when each column can keep readable text and 44px controls.

## Surfaces

- Information pages (About, Privacy, Legal notice, Sources) share one layout: an open header, a page switcher, three "at a glance" tiles, then prose sections with a contents list beside them from 960 px. Page-specific blocks: the privacy data table (what is stored, where, what the reader can do), the legal identity block, and the sources register grouped by category. Body copy is French in `LegalPage.jsx`, English and Arabic in `public/data/editorial-copy.json`; the privacy copy must stay true to what the code sends (see `docs/SECURITY_PRIVACY.md`).
- Footer: brand and promise, then four link groups (explore, listen and pray, popular surahs, the project), after quran.com's footer. Links are real `<a>` for destinations and `<button>` for panels; every target is 44 px tall.
- Settings: five tabs (General, Display, Audio, Prayer, Data). Downloads, storage, backup, protection and erasure all live under Data. Each tab is its own file under `src/components/settings/`; `SettingsModal.jsx` keeps the shell and the Data tab.

- Cards: use a subtle border, a restrained shadow, and one radius family per section.
- Modals: portal overlays to `document.body` when the trigger may live inside fixed or transformed containers.
- Audio player: compact mode should not change height during playback. Expanded panels must cleanly reset when closed.
- Reading toolbar: keep primary mode, translation, tajweed, memorization, font and play controls discoverable, but allow horizontal scroll on small screens.

## Typography

- Arabic Quran text uses riwaya-safe font ids only.
- Use `clamp()` for Arabic sizes and keep refresh-stable persisted values.
- Latin UI labels should be short on mobile. Prefer icon-only buttons only when the `aria-label` is explicit and localized.
- French labels must keep accents. If a file is ASCII-only, use Unicode escapes inside JavaScript strings rather than mojibake.
- The Latin UI face is the platform system stack (`--ux-font-ui`): no UI webfont
  is shipped, so the boot payload stays free and each platform reads native.
  Decided 2026-09-24 — names such as Manrope, Figtree, Inter, Outfit, Cairo and
  Fraunces were never declared by any `@font-face` and silently fell through to
  the system font; every verified render already used the system stack. Any
  future brand webfont must be self-hosted, subset, budgeted, and declared in
  `index.html` or `tailwind.css` before its name enters a stack.
- Verse-number digits inside drawn ornaments (`.qcm-rosette__num`) use the
  declared Arabic faces (`--ux-font-ar`), never the UI stack.

## States

- Active: visible border and color change, not color alone.
- Hover: gentle lift or tint only; avoid large layout shifts.
- Focus: always visible with an outline or ring that survives dark mode.
- Loading: skeletons must not create an opaque veil over loaded reading text.
- Error: explain what failed and expose a retry or repair action.

## Bundle Discipline

- Prefer tests and documentation for roadmap progress when JS budget is tight.
- Reuse existing classes and tokens before adding new CSS.
- Any new production dependency must justify its bundle cost.
