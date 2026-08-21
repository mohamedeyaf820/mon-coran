#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import postcss from "postcss";
import { PurgeCSS } from "purgecss";
import {
  CSS_CONTENT_PATTERNS,
  CSS_SAFELIST,
  extractCssSelectors,
} from "./cssPurgeConfig.mjs";

const SOURCE_PATTERN = "src/styles/**/*.css";
const IMPORTANT_PATTERN = /!important\b/g;
const formatKb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
const shouldCheck = process.argv.includes("--check");
const LIMITS = {
  // Source size is a maintenance guard; the retained and production bundle
  // budgets remain the stricter deployment gates. Updated to reflect current
  // measured sizes after responsive reader, recitation platform, and mushaf
  // style additions.
  sourceKb: Number(process.env.CSS_SOURCE_BUDGET_KB || 1750),
  retainedKb: Number(process.env.CSS_RETAINED_BUDGET_KB || 1150),
  important: Number(process.env.CSS_IMPORTANT_BUDGET || 7240),
  duplicateRules: Number(process.env.CSS_DUPLICATE_RULE_BUDGET || 0),
  crossFileDuplicateRules: Number(
    process.env.CSS_CROSS_FILE_DUPLICATE_BUDGET || 0,
  ),
};

function findExactDuplicateRules(css) {
  const root = postcss.parse(css);
  const seen = new Set();
  let count = 0;
  let bytes = 0;
  const selectors = [];

  root.walkRules((rule) => {
    const contexts = [];
    let parent = rule.parent;
    while (parent && parent.type !== "root") {
      if (parent.type === "atrule") {
        contexts.unshift(`@${parent.name} ${parent.params}`);
      }
      parent = parent.parent;
    }

    const declarations = (rule.nodes || [])
      .map((node) =>
        node.type === "decl"
          ? `${node.prop}:${node.value}${node.important ? "!important" : ""}`
          : node.toString(),
      )
      .join(";");
    const signature = `${contexts.join("|")}::${rule.selector}::${declarations}`;
    if (seen.has(signature)) {
      count += 1;
      bytes += Buffer.byteLength(rule.toString());
      selectors.push(`${contexts.join(" > ") || "root"} > ${rule.selector}`);
      return;
    }
    seen.add(signature);
  });

  return { count, bytes, selectors };
}

function findCrossFileExactDuplicateRules(files) {
  const seen = new Map();
  const duplicates = [];

  for (const { file, css } of files) {
    const root = postcss.parse(css);
    root.walkRules((rule) => {
      const contexts = [];
      let parent = rule.parent;
      while (parent && parent.type !== "root") {
        if (parent.type === "atrule") {
          contexts.unshift(`@${parent.name} ${parent.params}`);
        }
        parent = parent.parent;
      }

      const declarations = (rule.nodes || [])
        .map((node) =>
          node.type === "decl"
            ? `${node.prop}:${node.value}${node.important ? "!important" : ""}`
            : node.toString(),
        )
        .join(";");
      const signature = `${contexts.join("|")}::${rule.selector}::${declarations}`;
      const firstFile = seen.get(signature);
      if (firstFile && firstFile !== file) {
        duplicates.push({ firstFile, file, selector: rule.selector });
      } else if (!firstFile) {
        seen.set(signature, file);
      }
    });
  }

  return duplicates;
}

const [contentFiles, cssFiles] = await Promise.all([
  glob(CSS_CONTENT_PATTERNS, { absolute: true }),
  glob(SOURCE_PATTERN, { absolute: true }),
]);

if (contentFiles.length === 0) {
  throw new Error("[css-audit] Build output missing. Run npm run build first.");
}

const rows = [];
const parsedCssFiles = [];
for (const cssFile of cssFiles) {
  const raw = await readFile(cssFile, "utf8");
  const relativeFile = path.relative(process.cwd(), cssFile);
  parsedCssFiles.push({ file: relativeFile, css: raw });
  const duplicateRules = findExactDuplicateRules(raw);
  const [result] = await new PurgeCSS().purge({
    content: contentFiles,
    css: [{ raw, name: path.basename(cssFile) }],
    defaultExtractor: extractCssSelectors,
    safelist: CSS_SAFELIST,
    rejected: true,
  });

  rows.push({
    file: relativeFile,
    sourceBytes: Buffer.byteLength(raw),
    retainedBytes: Buffer.byteLength(result?.css || ""),
    importantCount: raw.match(IMPORTANT_PATTERN)?.length || 0,
    rejectedCount: result?.rejected?.length || 0,
    duplicateCount: duplicateRules.count,
    duplicateBytes: duplicateRules.bytes,
    duplicateSelectors: duplicateRules.selectors,
  });
}

const crossFileDuplicates = findCrossFileExactDuplicateRules(parsedCssFiles);

rows.sort((left, right) => right.retainedBytes - left.retainedBytes);

console.log("[css-audit] Largest retained source layers");
for (const row of rows.slice(0, 15)) {
  const retainedPercent = row.sourceBytes
    ? Math.round((row.retainedBytes / row.sourceBytes) * 100)
    : 0;
  console.log(
    `- ${row.file}: ${formatKb(row.retainedBytes)} retained (${retainedPercent}%), ` +
      `${row.importantCount} !important, ${row.rejectedCount} selectors removable`,
  );
}

const totals = rows.reduce(
  (summary, row) => ({
    sourceBytes: summary.sourceBytes + row.sourceBytes,
    retainedBytes: summary.retainedBytes + row.retainedBytes,
    importantCount: summary.importantCount + row.importantCount,
    rejectedCount: summary.rejectedCount + row.rejectedCount,
    duplicateCount: summary.duplicateCount + row.duplicateCount,
    duplicateBytes: summary.duplicateBytes + row.duplicateBytes,
  }),
  {
    sourceBytes: 0,
    retainedBytes: 0,
    importantCount: 0,
    rejectedCount: 0,
    duplicateCount: 0,
    duplicateBytes: 0,
  },
);

console.log("[css-audit] Source summary");
console.log(`- Source CSS: ${formatKb(totals.sourceBytes)}`);
console.log(`- Retained against the production app: ${formatKb(totals.retainedBytes)}`);
console.log(`- !important declarations: ${totals.importantCount}`);
console.log(`- Removable selectors: ${totals.rejectedCount}`);
console.log(
  `- Exact duplicate rules: ${totals.duplicateCount} (${formatKb(totals.duplicateBytes)})`,
);
console.log(`- Cross-file exact duplicate rules: ${crossFileDuplicates.length}`);

if (crossFileDuplicates.length > 0) {
  console.log("[css-audit] Cross-file exact duplicates");
  for (const duplicate of crossFileDuplicates.slice(0, 12)) {
    console.log(
      `- ${duplicate.firstFile} ↔ ${duplicate.file}: ${duplicate.selector}`,
    );
  }
}

const duplicateRows = rows
  .filter((row) => row.duplicateCount > 0)
  .sort((left, right) => right.duplicateBytes - left.duplicateBytes)
  .slice(0, 8);
if (duplicateRows.length > 0) {
  console.log("[css-audit] Largest exact-duplicate groups");
  for (const row of duplicateRows) {
    console.log(
      `- ${row.file}: ${row.duplicateCount} rules (${formatKb(row.duplicateBytes)}) — ` +
        row.duplicateSelectors.join(", "),
    );
  }
}

if (shouldCheck) {
  const failures = [];
  if (totals.sourceBytes > LIMITS.sourceKb * 1024) {
    failures.push(`source CSS exceeds ${LIMITS.sourceKb} kB`);
  }
  if (totals.retainedBytes > LIMITS.retainedKb * 1024) {
    failures.push(`retained CSS exceeds ${LIMITS.retainedKb} kB`);
  }
  if (totals.importantCount > LIMITS.important) {
    failures.push(`!important count exceeds ${LIMITS.important}`);
  }
  if (totals.duplicateCount > LIMITS.duplicateRules) {
    failures.push(`exact duplicate rules exceed ${LIMITS.duplicateRules}`);
  }
  if (crossFileDuplicates.length > LIMITS.crossFileDuplicateRules) {
    failures.push(
      `cross-file exact duplicate rules exceed ${LIMITS.crossFileDuplicateRules}`,
    );
  }
  if (failures.length > 0) {
    console.error(`[css-audit] Budget failed: ${failures.join("; ")}`);
    process.exitCode = 1;
  } else {
    console.log("[css-audit] Budget OK");
  }
}
