// SEO route files are generated after the CSS purge and repeat the app shell.
// Scanning the single shell plus built JS keeps purge/audit results identical
// without re-reading thousands of generated HTML files for every CSS layer.
export const CSS_CONTENT_PATTERNS = ["dist/index.html", "dist/assets/**/*.js"];

export const CSS_SAFELIST = {
  standard: [
    /^app-mode-/,
    /^qcm-word--/,
    /^qcom-list-study/,
    /^qc-list-card__study$/,
    /^tajweed-/,
    /^verse-/,
    /^warsh-/,
    /^data-/,
    /^aria-/,
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
    /^data-/,
    /^aria-/,
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
  ],
};

export function extractCssSelectors(content) {
  return content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
}
