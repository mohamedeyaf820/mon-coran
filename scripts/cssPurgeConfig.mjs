// SEO route files are generated after the CSS purge and repeat the app shell.
// Scanning the single shell plus built JS keeps purge/audit results identical
// without re-reading thousands of generated HTML files for every CSS layer.
export const CSS_CONTENT_PATTERNS = ["dist/index.html", "dist/assets/**/*.js"];

export const CSS_SAFELIST = {
  standard: [
    /^app-mode-/,
    /^qcm-word--/,
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
  deep: [/^data-/, /^aria-/],
};

export function extractCssSelectors(content) {
  return content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
}
