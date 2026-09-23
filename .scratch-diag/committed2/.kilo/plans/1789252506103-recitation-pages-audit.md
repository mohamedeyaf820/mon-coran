# Recitation Pages Audit — Findings & Actionable Improvements

## Scope
- Surface: MushafPlus recitation pages, reading interface, reciter detail modal, immersive full-screen reader.
- Mode: Review/audit; no source changes.
- Priority order: Quran text integrity, RTL correctness, audio continuity, then layout polish.

## Verified facts from code
- Arabic text is rendered in multiple places with `dir="rtl" lang="ar"` in the reciter detail modal and surah rows, but the full-screen overlay portal relies on CSS overrides for inline Arabic flow.
- `FullscreenMushafOverlay.jsx` creates a fixed portal with `z-index: 99999`, hides document body scrolling, and uses `document.body.style.overflow = "hidden"`.
- Full-screen overlay navigation uses `document.body.style.overflow = "hidden"` and restores it on unmount, but it does not explicitly pause or preserve audio state during the transition.
- `QuranDisplay.jsx` opens the overlay with `view.setFullPage(true)` before any page data is fetched or navigated.
- `useQuranDisplayView.js` computes Arabic font sizes, line-heights, and applies font-family/font-size directly to Arabic elements.
- `fontLoader.js` uses `FontFace` with `display: "swap"` for many fonts and has a 10s timeout.
- `recitationStyles.js` loads `recitation-polish.css` and `reciter-enhanced.css` for the reciter modal/list.
- `recitation-polish.css` uses very small text sizes in several places (`0.65rem`–`0.88rem`) and compact touch targets in the reciter list/modal.
- `reader-calm.css` and `reader-premium.css` contain conflicting overrides for the same reading surface.
- `reader-premium.css` includes explicit RTL/inline Arabic fixes for the full-screen portal, but only for the portal selectors it covers.

## Findings

### 1) Arabic Typography & Rendering

#### P0 — Missing letters / broken Arabic in full-screen overlay
- Where: `src/components/QuranDisplay/FullscreenMushafOverlay.jsx`, `src/styles/domains/reader-premium.css`
- Evidence:
  - Full-screen overlay is a portal outside `.app-root`, so many base reader rules do not apply there.
  - The portal depends on a long CSS override list to force Arabic elements to `display: inline !important`, `white-space: normal`, and `unicode-bidi: plaintext`.
  - If a new Arabic element class is added inside the portal and it is not covered by those selectors, it can inherit block layout, wrong direction, or clipping.
  - The exact Mushaf page path uses `QuranMushafPage`, which may have its own typography assumptions not covered by the portal overrides.
- User impact:
  - Missing letters, broken joins, or rendering crashes in full-screen mode.
  - Quran text integrity risk.
- Smallest concrete fix:
  - Centralize Arabic typography rules in a shared token or utility class used by both normal reader and portal.
  - Add a portal-specific safety layer that applies `direction: rtl`, `unicode-bidi: plaintext`, `display: inline`, `word-break: normal`, `overflow-wrap: normal`, and `font-kerning: normal` to all Quran Arabic text descendants.
  - Add an explicit regression test or snapshot for a page containing long connected words and diacritics.

#### P1 — Font loading race can show missing glyphs or fallback boxes
- Where: `src/services/fontLoader.js`, `src/components/QuranDisplay.jsx`
- Evidence:
  - `fontLoader.js` uses `display: "swap"` for local fonts.
  - `QuranDisplay.jsx` starts font loading after render, and `readerBusy` only hides content when `fontLoading && ayahs.length === 0`.
  - If the font loads after the page is already visible, Arabic glyphs may flash or render with fallback.
- User impact:
  - Temporary missing letters, inconsistent appearance, or perceived crashes.
- Smallest concrete fix:
  - Keep the reader in a loading/placeholder state until the selected font is loaded or a timeout expires.
  - Prefer `display: "optional"` or a stricter fallback strategy for Quran text.
  - Add a visible font-ready state before showing Arabic text.

#### P1 — RTL direction is inconsistent across surfaces
- Where: `src/components/recitation/ReciterDetailPage.jsx`, `src/components/recitation/SurahRecitationRow.jsx`, `src/components/QuranDisplay/FullscreenMushafOverlay.jsx`
- Evidence:
  - Reciter modal sets `dir={isRtl ? "rtl" : "ltr"}`.
  - Surah rows set `dir="rtl"` only on the Arabic text span.
  - Full-screen overlay sets `data-view="reading"` but not a global `dir` on the portal.
- User impact:
  - Mixed direction in Arabic mode can misalign numbers, buttons, and page navigation.
- Smallest concrete fix:
  - Set `dir="rtl"` on the top-level portal when `lang === "ar"`.
  - Keep numbers and controls explicitly `dir="ltr"` where needed.
  - Ensure page navigation labels and arrow directions match RTL behavior.

#### P2 — Arabic font size and line-height may clip marks or collapse lines
- Where: `src/utils/arabicTypography.js`, `src/components/QuranDisplay/useQuranDisplayView.js`
- Evidence:
  - Line-height is computed per font/riwaya, but some paths still pass `state.quranFontSize || 34` directly into `CleanPageView` in full-screen overlay.
  - Full-screen overlay zoom uses transform scaling, which can blur or distort Arabic marks at extreme zoom levels.
- User impact:
  - Diacritics may be clipped or lines may feel too tight.
- Smallest concrete fix:
  - Use the same `--qd-reading-font-size` and line-height tokens inside the full-screen overlay.
  - Avoid transform-only zoom for Arabic text at high magnification; prefer reflow or a bounded zoom range with a clear reset.

### 2) Full-Screen Mode Functionality

#### P0 — Audio playback interruption during full-screen transition
- Where: `src/components/QuranDisplay.jsx`, `src/components/QuranDisplay/FullscreenMushafOverlay.jsx`
- Evidence:
  - `openImmersiveMushaf` calls `view.setFullPage(true)` before any data fetch/navigation.
  - The overlay is a portal with `z-index: 99999` and hides document body scrolling.
  - There is no explicit pause/restore or state preservation of the audio service around the transition.
- User impact:
  - Audio stops, becomes inaccessible, or loses playback position when entering full-screen.
- Smallest concrete fix:
  - Treat full-screen as a presentation layer, not a new playback context.
  - Keep the shared audio service mounted and independent of the overlay.
  - Pass the current audio state into the overlay and expose a persistent playback control in the overlay header or bottom bar.
  - On close, restore focus and scroll position to the previous reading surface.

#### P1 — Full-screen overlay does not expose audio controls consistently
- Where: `src/components/QuranDisplay/FullscreenMushafOverlay.jsx`
- Evidence:
  - Overlay header has close, page label, zoom controls, and side navigation.
  - No persistent play/pause or progress control inside the overlay.
  - `onOpenPlayer` exists but is not visibly wired in the header.
- User impact:
  - User must leave full-screen to control audio.
- Smallest concrete fix:
  - Add a compact audio control cluster in the overlay header or bottom bar: play/pause, current ayah/surah label, and close.
  - Keep it visible during playback and ensure it works with keyboard and touch.

#### P1 — Focus management and Escape behavior are fragile
- Where: `src/components/QuranDisplay/FullscreenMushafOverlay.jsx`
- Evidence:
  - Overlay uses `role="dialog" aria-modal="true"`.
  - It handles Escape by calling `onClose`.
  - No focus trap or focus return is implemented.
- User impact:
  - Keyboard users can lose focus or be unable to reach audio controls.
- Smallest concrete fix:
  - Implement a focus trap on open.
  - Return focus to the fullscreen trigger on close.
  - Ensure Escape closes the overlay and does not leave the audio state inconsistent.

### 3) Visual Layout & UI Bugs

#### P1 — Conflicting reader CSS layers create layout instability
- Where: `src/styles/reader-calm.css`, `src/styles/domains/reader-premium.css`, `src/styles/readerStyles.js`
- Evidence:
  - `reader-calm.css` says it is loaded last, but `reader-premium.css` also claims to be loaded last.
  - Both files override the same reader classes with different visual rules.
  - Some rules are more specific than others, causing inconsistent rendering depending on load order.
- User impact:
  - Layout glitches, inconsistent spacing, and visual regressions across devices.
- Smallest concrete fix:
  - Choose one canonical reader style layer.
  - Remove or consolidate duplicate overrides.
  - Use CSS custom properties for spacing, color, and typography tokens.

#### P1 — Full-screen overlay uses inline styles for layout-critical values
- Where: `src/components/QuranDisplay/FullscreenMushafOverlay.jsx`
- Evidence:
  - Header, zoom controls, nav buttons, mobile footer, and book container use large inline style objects.
  - This makes responsive behavior and RTL adjustments harder to reason about.
- User impact:
  - Layout inconsistencies on narrow screens and RTL mode.
- Smallest concrete fix:
  - Move layout-critical styles into CSS classes.
  - Keep only dynamic values like zoom in inline styles.

#### P2 — Reciter modal/list text sizes are too small for study use
- Where: `src/styles/domains/recitation-polish.css`
- Evidence:
  - Many labels are `0.57rem`–`0.88rem`.
  - Search input is `0.78rem`.
  - Row meta is `0.69rem`.
- User impact:
  - Poor readability, especially on mobile and for users with visual impairments.
- Smallest concrete fix:
  - Raise minimum body/meta text to at least `0.85rem`–`1rem`.
  - Keep decorative labels small, but not essential reading text.

#### P2 — Touch targets are inconsistent
- Where: `src/styles/domains/recitation-polish.css`
- Evidence:
  - Many buttons are 34–38px.
  - Some mobile-specific controls are 32px or smaller.
- User impact:
  - Missed taps and poor mobile usability.
- Smallest concrete fix:
  - Enforce 44px minimum touch targets for interactive controls.
  - Use icon-only buttons with accessible labels where space is limited.

### 4) UX Enhancements

#### P2 — Add a persistent mini-player inside full-screen mode
- Where: `src/components/QuranDisplay/FullscreenMushafOverlay.jsx`
- Recommendation:
  - Add a slim bottom bar with play/pause, current ayah/surah, progress, and close.
  - Keep it collapsible so the Quran text remains the primary focus.
  - Ensure it remains visible while playback is active.

#### P2 — Improve study workflow with verse-level controls
- Where: `src/components/QuranDisplay/FullscreenMushafOverlay.jsx`, `src/components/QuranDisplay/PageMode.jsx`, `src/components/QuranDisplay/SurahMode.jsx`
- Recommendation:
  - Add repeat-current-ayah, slow-playback, and tajweed highlight toggles in the immersive reader.
  - Keep the controls minimal and context-aware.
  - Preserve reading position and playback state when toggling.

#### P2 — Add clear loading, empty, and error states for font/audio transitions
- Where: `src/components/QuranDisplay.jsx`, `src/services/fontLoader.js`
- Recommendation:
  - Show a subtle loading indicator while the selected font or audio asset is preparing.
  - If the font fails, fall back gracefully and notify the user without breaking the reading surface.
  - Avoid abrupt blank states when audio or font loading fails.

#### P3 — Improve visual hierarchy in the reciter modal
- Where: `src/components/recitation/ReciterDetailPage.jsx`, `src/styles/domains/recitation-polish.css`
- Recommendation:
  - Make the reciter name and audio mode the dominant elements.
  - Reduce decorative gradients and small badges that compete with the primary action.
  - Use a single primary action: start listening.
  - Keep sources and biography secondary and collapsed by default.

#### P3 — Add keyboard shortcuts and visible focus states
- Where: `src/components/QuranDisplay/FullscreenMushafOverlay.jsx`, `src/components/Quran/ReadingToolbar.jsx`
- Recommendation:
  - Document shortcuts for play/pause, prev/next page, zoom, and close.
  - Ensure focus rings are visible and consistent.
  - Make all icon buttons accessible with labels.

## Recommended implementation order

1. Stabilize Arabic rendering in the full-screen portal.
   - Centralize RTL and inline Arabic typography rules.
   - Apply them to both normal reader and portal.
   - Add regression coverage for long connected Arabic words and diacritics.

2. Preserve audio continuity through the full-screen transition.
   - Keep the audio service outside the overlay lifecycle.
   - Add a persistent audio control cluster inside the overlay.
   - Ensure close restores focus and scroll position.

3. Remove CSS layer conflicts.
   - Choose one canonical reader style layer.
   - Consolidate duplicate overrides.
   - Use tokens for spacing, color, and typography.

4. Improve reciter modal readability and touch targets.
   - Raise minimum text sizes.
   - Enforce 44px touch targets.
   - Simplify hierarchy around the primary listening action.

5. Add study-focused controls.
   - Repeat ayah, slow playback, tajweed highlight, and progress.
   - Keep them collapsible and non-intrusive.

## Validation plan

- Run lint and typecheck.
- Run the narrowest relevant tests first.
- Verify full-screen mode with audio playing before and after opening/closing the overlay.
- Verify Arabic text in both Hafs and Warsh modes.
- Verify RTL layout in Arabic language mode.
- Check 375px, 768px, and 1440px viewports.
- Verify keyboard navigation and focus return.
- Verify font loading and fallback behavior.
- Check reduced-motion support.
- Confirm no horizontal scroll or clipped Arabic text.
- Confirm audio controls remain visible and operable in full-screen mode.

## Open questions / assumptions

- The audit assumes the reported missing letters occur primarily in full-screen mode and with certain fonts or riwayas.
- If crashes are caused by a specific data shape or font file, a minimal reproducer should be added to the validation plan.
- The full-screen overlay should preserve the current reading surface state, including scroll position and active ayah, when reopened.
