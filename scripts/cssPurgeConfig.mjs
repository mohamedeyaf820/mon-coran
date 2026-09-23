// SEO route files are generated after the CSS purge and repeat the app shell.
// Scanning the single shell plus built JS keeps purge/audit results identical
// without re-reading thousands of generated HTML files for every CSS layer.
export const CSS_CONTENT_PATTERNS = ["dist/index.html", "dist/assets/**/*.js"];

export const CSS_SAFELIST = {
  standard: [
    /^app-mode-/,
    // PurgeCSS drops attribute selectors unless the attribute name survives as
    // a content token; dir/type/lang are set dynamically in JSX, so the minified
    // bundle never yields a bare `dir` token and RTL/range rules vanished.
    // `input` is guarded too: range-styled player sliders die with it.
    /^dir$/,
    /^type$/,
    /^lang$/,
    /^input$/,
    // Madani page classes are composed in template strings: the bare tokens
    // may not appear in the built JS, and purging `.qcm-line` turns the
    // 15-line flex grid into plain blocks. Fullscreen book classes are
    // retained by their literal names in the overlay module.
    /^qcm-/,
    /^qcom-list-study/,
    /^qc-list-card__study$/,
    // Tajweed rule classes of the span fallback (browsers without the
    // Custom Highlight API) are composed from the rule id.
    /^tajwid-/,
    // Search dialog parts are composed in the JSX; the purge dropped the
    // voice button from a `:is()` list.
    /^search-pro__/,
    "animate-in",
    "animate-out",
    "fade-in",
    "fade-out",
    "zoom-in",
    "zoom-out",
    "slide-in",
    "slide-out",
    "data-[side=bottom]",
    "data-[side=top]",
    "data-[side=left]",
    "data-[side=right]",
    "data-[state=open]",
    "data-[state=closed]",
  ],
  deep: [
    /^qcom-list-study/,
    /^qc-list-card__study$/,
  ],
  // PurgeCSS evaluates the complete selector for highly qualified rules
  // (`html body .app-root ...`). Keep this small reader action family even
  // when its lazy chunk has not been discovered while the CSS is purged.
  greedy: [
    /qcom-list-study/,
    /qc-list-card__study/,
    // Mushaf verses use role="button" for keyboard interaction. If their
    // ordered reader selectors are purged, the global button rule changes
    // them from an inline Quran flow to full-line inline-flex blocks.
    /quran-verse-inline/,
    /mushaf-verse/,
    /cpv-ayah-marker/,
  ],
};

export function extractCssSelectors(content) {
  // Rolldown keeps JSX template literals with backticks, so a class written as
  // `btn${on ? " is-on" : ""}` reaches this extractor glued to its interpolation
  // (`btn${on`) and PurgeCSS drops the rule for a class that is very much alive —
  // in production only, which is why the dev server never shows it. Split the
  // interpolation out before tokenising.
  return content.replace(/[{}$]/g, " ").match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
}
