#!/usr/bin/env node
/**
 * CSS Consolidation Build Script
 * Merges 31 CSS files into 3 consolidated bundles:
 * 1. critical.css - preload/inline, blocks first paint
 * 2. deferred.css - loaded via requestIdleCallback after paint
 * 3. route-specific/ - individual files for lazy import per route
 */

import fs from "fs";
import path from "path";

const STYLES_DIR = "src/styles";
const OUTPUT_DIR = "src/styles/consolidated";

const CRITICAL_FILES = [
  "tailwind.css",
  "domains/themes4.css",
  "ui-polish.css",
  "riwaya-fonts.css",
  "dark-mode-refonte.css",
  "domains/mobile-all-versions.css",
  "header-enhanced.css",
  "device-root.css",
  "experience-polish.css",
  "app-system.css",
];

const DEFERRED_FILES = [
  "responsive-all.css",
  "domains/premium-platform.css",
  "domains/premium-plus.css",
  "expert-overhaul.css",
  "home-audio-ux-refonte.css",
  "device-responsive.css",
];

// Route-specific files stay as individual files for lazy loading
const ROUTE_FILES = [
  "reading-ux-refonte.css",
  "domains/reading-platform.css",
  "mushaf-page-polish.css",
  "domains/reader-premium.css",
  "domains/reader-consolidation.css",
  "domains/search-home-polish.css",
  "domains/recitation-polish.css",
  "surah-reader-header.css",
  "surah-info-panel.css",
  "surah-banner.css",
  "sidebar-enhanced.css",
  "settings-enhanced.css",
  "settings-theme-previews.css",
  "reciter-enhanced.css",
  "audio-player-simple.css",
  "ayah-actions-modal.css",
  "surah-reader-header.css",
  "domains/duas-page.css",
  "domains/legal-page.css",
  "domains/not-found-page.css",
  "domains/footer-refonte.css",
  "domains/audio-legacy.css",
];

function readCss(file) {
  const filePath = path.join(STYLES_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARN] File not found: ${filePath}`);
    return "";
  }
  const content = fs.readFileSync(filePath, "utf8");
  return `/* ===== ${file} ===== */\n${content}\n`;
}

function writeBundle(name, files) {
  const content = files.map(readCss).join("\n");
  const outputPath = path.join(OUTPUT_DIR, name);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(outputPath, content, "utf8");
  const size = Buffer.byteLength(content, "utf8");
  console.log(`[OK] ${name}: ${(size / 1024).toFixed(1)} kB (${files.length} files)`);
  return size;
}

async function main() {
  console.log("🔧 CSS Consolidation Build");
  console.log("===========================\n");

  // 1. Critical CSS bundle
  console.log("\n📦 Building critical.css...");
  const totalCritical = writeBundle("critical.css", CRITICAL_FILES);

  // 2. Deferred CSS bundle
  console.log("\n📦 Building deferred.css...");
  const totalDeferred = writeBundle("deferred.css", DEFERRED_FILES);

  // 3. Verify route files exist (copy to consolidated/route/ for cleaner imports)
  console.log("\n📦 Preparing route-specific files...");
  const routeDir = path.join(OUTPUT_DIR, "route");
  fs.mkdirSync(routeDir, { recursive: true });
  let routeCount = 0;
  for (const file of ROUTE_FILES) {
    const src = path.join(STYLES_DIR, file);
    if (fs.existsSync(src)) {
      const dest = path.join(routeDir, path.basename(file));
      fs.copyFileSync(src, dest);
      routeCount++;
    }
  }
  console.log(`[OK] Copied ${routeCount} route-specific files to consolidated/route/`);

  // Summary
  console.log("\n📊 Summary");
  console.log("==========");
  console.log(`Critical CSS:   ${(totalCritical / 1024).toFixed(1)} kB`);
  console.log(`Deferred CSS:   ${(totalDeferred / 1024).toFixed(1)} kB`);
  console.log(`Route files:    ${routeCount} individual files`);
  console.log(`\n✅ Consolidation complete. Output: ${OUTPUT_DIR}/`);
}

main().catch(console.error);
