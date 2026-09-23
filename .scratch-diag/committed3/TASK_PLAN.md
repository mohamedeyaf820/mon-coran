# Mushaf Fullscreen Redesign — Task Plan (updated)

## Root Cause (confirmed by inspection + Playwright probes)
`justify-content: space-between` on `.qcm-line` spread words across the
16.7em measure, creating artificial gaps → word-grid look. Two stylesheets
owned the same `.qcm-*` classes (`reading-platform.css` legacy block +
`mushaf-book.css`), so the composition fought itself.

## Fixes applied
- [x] Isolate legacy `.qcm-*` fullscreen rules in `reading-platform.css`
      (32 selectors scoped back to the in-app reader; portal untouched).
- [x] `mushaf-book.css` is now the sole, self-sufficient owner of the
      immersive portal (base layout, lines, words, markers, edges).
- [x] Lines use `flex-start` (Hafs/QCF, glyphs cut to fill) and `center`
      (Warsh proportional font, short rows centred like print).
- [x] Warsh words inherit the line measure (`1em`); per-line fit scale made
      iterative so dense rows converge inside the box (floor 0.42, ≤4 passes).
- [x] Canonical page: outer + inner frame, 4 corner rosettes, running head
      (Juz · surah name · page), folio medallion, QuranSafeArea padding.
- [x] Double-page spread on ≥1150px landscape: odd folio right, even left,
      one shared `--mfp-font`, central gutter + spine shadow, step ±2.
- [x] Zen auto-hide (5.5s, pointer/touch/wheel/key reveal), global audio engine.
- [x] Zoom via typographic measure (no reflow, no transform scale).
- [x] Responsive: `computeLayout` (single <1024 or portrait, double ≥1150).

## Renderer decision (Phase 3)
`QuranMushafPage` (15-line dataset mapping) is the canonical printed-page
renderer and now powers fullscreen single + spread. `CleanPageView`
(continuous justified flow + translations) stays for normal reading: it never
had the grid defect, and forcing the 15-line grid into continuous reading
would regress translations/scroll. One dataset, two presentational layouts —
not three divergent compositions.

## Gates
- [x] `node --test tests/*.test.mjs` → 184 pass
- [x] `reader-ui-contract` → 29 pass
- [x] `eslint` changed files → clean
- [x] `npm run build` → OK
- [ ] `fullscreen-reader.spec.mjs` (chromium) → in progress
- [ ] Visual AVANT/APRÈS captures
