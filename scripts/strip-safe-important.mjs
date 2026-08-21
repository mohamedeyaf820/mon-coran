#!/usr/bin/env node
/**
 * Safe !important reduction script.
 * 
 * Strategy: Remove !important from properties that are NOT in the safe-keep list.
 * Safe-keep list = properties where !important is needed to override inline styles,
 * Tailwind utilities, or third-party component libraries.
 * 
 * We only strip !important from display, layout, spacing and visual properties
 * that are already at high specificity (html body .app-root selectors).
 */

import fs from "fs";

const SAFE_TO_STRIP = [
  "gap",
  "row-gap",
  "column-gap",
  "grid-gap",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "margin-inline",
  "margin-block",
  "margin-inline-start",
  "margin-inline-end",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "padding-inline",
  "padding-block",
  "border-radius",
  "border-color",
  "border-style",
  "border-width",
  "border",
  "border-top",
  "border-bottom",
  "border-left",
  "border-right",
  "border-inline",
  "border-block",
  "outline",
  "outline-offset",
  "box-shadow",
  "opacity",
  "cursor",
  "pointer-events",
  "overflow",
  "overflow-x",
  "overflow-y",
  "text-overflow",
  "text-decoration",
  "text-transform",
  "letter-spacing",
  "word-spacing",
  "transition",
  "animation",
  "transform",
  "filter",
  "backdrop-filter",
  "-webkit-backdrop-filter",
  "object-fit",
  "object-position",
  "aspect-ratio",
  "resize",
  "appearance",
  "-webkit-appearance",
  "scroll-behavior",
  "scroll-padding",
  "scroll-snap-type",
  "will-change",
  "contain",
  "isolation",
  "mix-blend-mode",
  "list-style",
  "list-style-type",
  "text-indent",
  "vertical-align",
  "visibility",
  "user-select",
  "-webkit-user-select",
  "touch-action",
  "-webkit-tap-highlight-color",
  "backface-visibility",
  "-webkit-backface-visibility",
  "content-visibility",
];

const SAFE_SET = new Set(SAFE_TO_STRIP);

const TARGET_FILES = [
  "src/styles/home-audio-ux-refonte.css",
  "src/styles/responsive-all.css",
  "src/styles/domains/reading-platform.css",
  "src/styles/domains/reader-consolidation.css",
  "src/styles/domains/search-home-polish.css",
  "src/styles/experience-polish.css",
  "src/styles/settings-enhanced.css",
  "src/styles/device-responsive.css",
  "src/styles/audio-player-simple.css",
];

function stripSafeImportant(css) {
  let removed = 0;
  const result = css.replace(
    /([a-z-]+)\s*:\s*([^;{}]+?)(\s*!important)\s*(;|})/gi,
    (match, prop, value, imp, terminator) => {
      const propLower = prop.trim().toLowerCase();
      if (SAFE_SET.has(propLower)) {
        removed++;
        return `${prop}: ${value.trimEnd()}${terminator}`;
      }
      return match;
    }
  );
  return { result, removed };
}

let grandTotal = 0;

for (const file of TARGET_FILES) {
  if (!fs.existsSync(file)) {
    console.log(`[SKIP] ${file} not found`);
    continue;
  }

  const original = fs.readFileSync(file, "utf8");
  const beforeCount = (original.match(/!important/g) || []).length;
  const { result, removed } = stripSafeImportant(original);
  const afterCount = (result.match(/!important/g) || []).length;

  if (removed > 0) {
    fs.writeFileSync(file, result, "utf8");
    console.log(`[OK] ${file}: ${beforeCount} → ${afterCount} !important (removed ${removed})`);
    grandTotal += removed;
  } else {
    console.log(`[--] ${file}: ${beforeCount} !important (no safe removals)`);
  }
}

console.log(`\n Total !important removed: ${grandTotal}`);
