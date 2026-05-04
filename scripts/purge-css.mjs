#!/usr/bin/env node
/**
 * CSS Purge Script
 * Removes unused CSS classes to reduce bundle size
 */

import { PurgeCSS } from "purgecss";
import { glob } from "glob";
import fs from "fs";
import path from "path";

async function purgeCSS() {
  console.log("🧹 Starting CSS purge...");

  const distPath = path.resolve("dist");
  const cssPath = path.join(distPath, "assets");

  // Find all CSS files
  const files = fs.readdirSync(cssPath);
  const cssFiles = files.filter((f) => f.endsWith(".css"));

  console.log(`📁 Found ${cssFiles.length} CSS files`);
  
  // Pre-expand glob patterns for content files
  console.log("🔍 Expanding content paths...");
  const contentPatterns = [
    "dist/**/*.html",
    "dist/**/*.js",
    "src/**/*.jsx",
    "src/**/*.js",
    "index.html",
  ];
  
  let allContentFiles = [];
  for (const pattern of contentPatterns) {
    const matches = await glob(pattern, { absolute: true });
    allContentFiles.push(...matches);
  }
  
  // Remove duplicates
  allContentFiles = [...new Set(allContentFiles)];
  console.log(`📄 Found ${allContentFiles.length} content files`);

  for (const cssFile of cssFiles) {
    const cssFilePath = path.join(cssPath, cssFile);
    const originalSize = fs.statSync(cssFilePath).size;

    console.log(`\n📝 Processing ${cssFile}...`);
    console.log(`   Original size: ${(originalSize / 1024).toFixed(2)} KB`);

    try {
      console.log(`   CSS file: ${cssFilePath}`);
      console.log(`   File exists: ${fs.existsSync(cssFilePath)}`);
      
      const purgeCSS = new PurgeCSS();
      const results = await purgeCSS.purge({
        content: allContentFiles,
        css: [cssFilePath],
        defaultExtractor: (content) => {
          // Capture Tailwind classes including those with special characters
          const matches = content.match(/[\w-/:]+[\w-]/g) || [];
          return matches;
        },
        safelist: {
          standard: [
            // Only preserve truly dynamic classes
            /^verse-/,
            /^ayat-/,
            /^mp-/,
            /^hp/,
            /^qc-/,
            /^hdr/,
            /^app/,
            /^warsh/,
            /^basmala/,
            /^tajweed/,
            /^surah/,
            /^ayah/,
            /^page/,
            /^juz/,
            // shadcn/ui specific classes
            /^data-[state|side|orientation|active|checked|open|closed|disabled]/,
            /^aria-[expanded|selected|hidden|checked]/,
            // Animations that may be dynamically added
            'animate-in',
            'animate-out',
            'fade-in',
            'fade-out',
            'zoom-in',
            'zoom-out',
            'slide-in',
            'slide-out',
            // Popover/Tooltip specific
            'data-[side=bottom]',
            'data-[side=top]',
            'data-[side=left]',
            'data-[side=right]',
            'data-[state=open]',
            'data-[state=closed]',
          ],
          deep: [/^data-/, /^aria-/],
          greedy: [],
        },
      });

      console.log(`   Results count: ${results?.length || 0}`);
      
      if (results && results.length > 0 && results[0]?.css) {
        const result = results[0];
        const rejectedCount = result.rejected?.length || 0;
        
        fs.writeFileSync(cssFilePath, result.css);

        const newSize = fs.statSync(cssFilePath).size;
        const reduction = ((originalSize - newSize) / originalSize) * 100;

        console.log(`   New size: ${(newSize / 1024).toFixed(2)} KB`);
        console.log(`   Reduction: ${reduction.toFixed(1)}% 🎉`);
        console.log(`   Removed selectors: ${rejectedCount}`);
        
        if (rejectedCount === 0) {
          console.log(`   ⚠️  No selectors were removed. Check content paths or safelist.`);
        }
      } else {
        console.log(`   ⚠️  No CSS output from PurgeCSS`);
        if (results) {
          console.log(`   Results type: ${typeof results}, length: ${results.length}`);
          if (results[0]) {
            console.log(`   First result keys: ${Object.keys(results[0]).join(', ')}`);
          }
        }
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${cssFile}:`, error.message);
    }
  }

  console.log("\n✅ CSS purge complete!");
}

purgeCSS().catch(console.error);
