# Styles Organization

The CSS is loaded in layers from broad foundations to final UI decisions:

1. `tailwind.css`
   Base tokens, font faces, Tailwind entrypoint, and legacy global styles that are still shared widely.
2. `domains/*.css`
   Extracted feature/domain layers from the previous monolithic stylesheet.
   - `footer-refonte.css`: footer redesign layer.
   - `duas-page.css`: duas page layout, cards, and polish.
   - `themes4.css`: canonical theme tokens and the stable light/sepia/dark contracts.
   - `premium-platform.css`: shared premium platform tokens and surfaces.
   - `premium-plus.css`: premium plus global coherence and final platform refinements.
   - `mobile-all-versions.css`: final phone and tablet responsive layer.
   - `reader-consolidation.css`: reader and mushaf display consolidation.
   - `search-home-polish.css`: search and home refinements.
   - `reading-platform.css`: reading platform layout and interaction styles.
   - `recitation-polish.css`: recitation page cards and row polish.
   - `audio-legacy.css`: older audio player compatibility rules.
3. `responsive.css`
   Cross-feature responsive rules.
4. `ui-polish.css`
   Final visual layer for the current redesign: audio player, settings drawer, dark theme, reciter cards, and footer.

When changing a feature, prefer the closest domain file. Use `ui-polish.css` only for intentional final overrides that must win the cascade.

Feature routes with several style sources use a small JavaScript entrypoint
(`readerStyles.js`, `recitationStyles.js`) to make their cascade order explicit
and to keep route-level imports consolidated.

## CSS guardrails

Run `npm run audit:css` after changing a style layer. The audit reports retained
source size, `!important` usage, removable selectors, and exact duplicate rules
both within and across files.
`npm run build:ci` enforces the current ceilings and rejects new exact duplicates.

The current guardrails are intentionally close to the measured build: 907 kB
aggregate production CSS, 1508 kB source CSS, 1005 kB retained source CSS, and
6860 `!important` declarations. Lower these ceilings whenever a cleanup lands;
do not raise them to accommodate a feature without first splitting its route CSS.

Prefer component or route imports for feature-only styles. Keep `tailwind.css`
limited to tokens, shared primitives, utilities, and rules needed before the first
route chunk is available.

Semantic theme variables (`--theme-*` and their shared aliases) belong to
`domains/themes4.css`. Lazy feature layers may define feature tokens, but must
not redefine the global light, sepia, or dark palette: doing so makes colors depend on
which route bundle happened to load first.
