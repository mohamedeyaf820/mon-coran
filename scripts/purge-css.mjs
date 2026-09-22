#!/usr/bin/env node
/**
 * Purges unused selectors from the built CSS assets.
 *
 * PurgeCSS handles raw CSS reliably across platforms, while passing Windows
 * paths as glob-like CSS entries can return an empty result set.
 */

import fs from "fs";
import path from "path";
import { glob } from "glob";
import { PurgeCSS } from "purgecss";
import {
  CSS_CONTENT_PATTERNS,
  CSS_SAFELIST,
  extractCssSelectors,
} from "./cssPurgeConfig.mjs";

async function expandContentFiles() {
  const files = [];
  for (const pattern of CSS_CONTENT_PATTERNS) {
    files.push(...(await glob(pattern, { absolute: true })));
  }
  return [...new Set(files)];
}

async function purgeCSS() {
  console.log("[purge-css] Starting CSS purge...");

  const cssPath = path.resolve("dist", "assets");
  const cssFiles = fs
    .readdirSync(cssPath)
    .filter((file) => file.endsWith(".css"));

  console.log(`[purge-css] Found ${cssFiles.length} CSS files`);
  console.log("[purge-css] Expanding content paths...");
  const contentFiles = await expandContentFiles();
  console.log(`[purge-css] Found ${contentFiles.length} content files`);

  const dynamicAttrPattern = /\[(?:dir|lang|type)[=~]/;
  const attrRuleSplit = /([^{}]+)\{[^{}]*\}/g;
  const attrPairs = [];

  for (const cssFile of cssFiles) {
    const cssFilePath = path.join(cssPath, cssFile);
    const originalSize = fs.statSync(cssFilePath).size;
    const cssRaw = fs.readFileSync(cssFilePath, "utf8");

    console.log(`\n[purge-css] Processing ${cssFile}...`);
    console.log(`   Original size: ${(originalSize / 1024).toFixed(2)} KB`);

    try {
      const results = await new PurgeCSS().purge({
        content: contentFiles,
        css: [{ raw: cssRaw, name: cssFile }],
        defaultExtractor: extractCssSelectors,
        safelist: CSS_SAFELIST,
        rejected: true,
      });

      const result = results?.[0];
      if (!result?.css) {
        console.log("   Warning: no CSS output from PurgeCSS");
        continue;
      }

      fs.writeFileSync(cssFilePath, result.css);
      attrPairs.push({ cssFile, raw: cssRaw, out: result.css });

      const newSize = fs.statSync(cssFilePath).size;
      const reduction = ((originalSize - newSize) / originalSize) * 100;
      console.log(`   New size: ${(newSize / 1024).toFixed(2)} KB`);
      console.log(`   Reduction: ${reduction.toFixed(1)}%`);
      console.log(`   Removed selectors: ${result.rejected?.length || 0}`);
    } catch (error) {
      console.error(`   Error processing ${cssFile}:`, error?.message || error);
      process.exitCode = 1;
    }
  }

  const contentBlob = contentFiles
    .map((file) => {
      try {
        return fs.readFileSync(file, "utf8");
      } catch {
        return "";
      }
    })
    .join("\n");

  // PurgeCSS cannot see runtime attribute values, so [dir=]/[lang=]/[type=]
  // rules are protected via CSS_SAFELIST. Fail the build when a rule whose
  // class tokens are ALL still live in the bundle disappears: that is the
  // silent-RTL-regression signature this gate exists to catch. Rules with a
  // dead class token are legitimately dropped (dead CSS cleanup).
  const liveAttrViolations = [];
  const normalizeSelector = (value) =>
    value.replace(/\s+/g, "").replace(/["']/g, "");
  for (const { cssFile, raw, out } of attrPairs) {
    const outNormalized = normalizeSelector(out);
    for (const [, head] of raw.matchAll(attrRuleSplit)) {
      const selector = head.trim();
      if (!dynamicAttrPattern.test(selector)) continue;
      const classTokens = selector.match(/\.[^\s.,:>()[\]\\]+(?:\\.[^\s.,:>()[\]\\]*)*/g) || [];
      if (!classTokens.length) continue;
      // Token-exact like PurgeCSS: `audio-player__x` does not make
      // `.audio-player` live.
      const allLive = classTokens.every((token) => {
        const name = token.replace(/^\./, "").replace(/\\/g, "");
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`(^|[^\\w-])${escaped}([^\\w-]|$)`).test(contentBlob);
      });
      if (allLive && !outNormalized.includes(normalizeSelector(selector))) {
        liveAttrViolations.push(`${cssFile}: ${selector.slice(0, 140)}`);
      }
    }
  }
  if (liveAttrViolations.length > 0) {
    throw new Error(
      `Dynamic attribute selectors with live tokens were purged (${liveAttrViolations.length}):\n` +
        liveAttrViolations.join("\n") +
        "\nAdd the attribute name to CSS_SAFELIST in scripts/cssPurgeConfig.mjs.",
    );
  }
  console.log(
    `[purge-css] Live dynamic attribute selectors preserved across ${attrPairs.length} files.`,
  );

  const purgedCss = cssFiles
    .map((cssFile) => fs.readFileSync(path.join(cssPath, cssFile), "utf8"))
    .join("\n");
  const requiredReaderRules = [
    {
      label: "continuous Mushaf verse flow",
      pattern:
        /\.mushaf-text-block\s*>\s*\.quran-verse-inline[^{}]*\{[^{}]*display:\s*inline\s*!important/i,
    },
    {
      label: "inline Mushaf verse content",
      pattern:
        /\.mushaf-container\s+\.mushaf-verse[^{}]*\{[^{}]*display:\s*inline\s*!important/i,
    },
    {
      label: "continuous Mushaf marker spacing",
      pattern:
        /\.cpv-ayah-marker[^{}]*\{[^{}]*margin-inline:\s*[^;}]+/i,
    },
    // The reciter sheet's action row. These classes are written as
    // `btn${cond ? " is-x" : ""}`, which the minifier emits with backticks; the
    // extractor used to hand PurgeCSS `btn${cond` instead of `btn`, so the rules
    // disappeared in production only and the surah title collapsed to 0px under
    // the download button. They must never be droppable again.
    {
      label: "offline download action stays icon-sized",
      pattern:
        /\.recitation-action-btn--download[^{}(]*\{[^{}]*min-width:\s*44px/i,
    },
    {
      label: "offline download action hides its long label",
      pattern:
        /\.recitation-action-btn--download\s+\.recitation-action-btn__label[^{}]*\{[^{}]*display:\s*none/i,
    },
    {
      label: "surah revelation-type badge",
      pattern: /\.recitation-row__type[^{}]*\{[^{}]*\}/i,
    },
    {
      label: "whole-mushaf download card primary action",
      pattern: /\.full-quran-download__primary[^{}]*\{[^{}]*\}/i,
    },

  ];
  const missingReaderRules = requiredReaderRules.filter(
    ({ pattern }) => !pattern.test(purgedCss),
  );
  if (missingReaderRules.length > 0) {
    throw new Error(
      `Critical reader CSS removed by purge: ${missingReaderRules
        .map(({ label }) => label)
        .join(", ")}`,
    );
  }

  console.log("\n[purge-css] CSS purge complete.");
}

purgeCSS().catch((error) => {
  console.error("[purge-css] Fatal error:", error?.message || error);
  process.exit(1);
});
