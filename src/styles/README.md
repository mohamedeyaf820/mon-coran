# Styles Organization

The CSS is loaded in layers from broad foundations to final UI decisions:

1. `tailwind.css`
   Base tokens, font faces, Tailwind entrypoint, and legacy global styles that are still shared widely.
2. `domains/*.css`
   Extracted feature/domain layers from the previous monolithic stylesheet.
   - `footer-refonte.css`: footer redesign layer.
   - `duas-page.css`: duas page layout, cards, and polish.
   - `themes4.css`: unified four-theme visual layer.
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
