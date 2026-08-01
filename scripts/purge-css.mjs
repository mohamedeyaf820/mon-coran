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
        /\.cpv-ayah-marker[^{}]*\{[^{}]*margin-inline:\s*\.12em\s+\.38em\s*!important/i,
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
