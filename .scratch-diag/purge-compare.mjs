/**
 * Compare the shipped token extractor against one that understands JSX template
 * literals, on the same unpurged CSS, and list what comes back.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { PurgeCSS } from "purgecss";
import { glob } from "glob";

import { CSS_CONTENT_PATTERNS, CSS_SAFELIST } from "../scripts/cssPurgeConfig.mjs";

const current = (content) => content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];

// Rolldown emits JSX template literals with backticks, so a class written as
// `btn${on ? " is-on" : ""}` reaches the extractor glued to `${on ?`.
const fixed = (content) =>
  content.replace(/[{}$]/g, " ").match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];

const contentFiles = [];
for (const pattern of CSS_CONTENT_PATTERNS) {
  contentFiles.push(...(await glob(pattern, { absolute: true })));
}

const cssFiles = readdirSync("dist/assets").filter((f) => f.endsWith(".css"));

const selectorsOf = (css) =>
  [...css.matchAll(/([^{}@\/][^{}]*?)\{/g)].map((m) => m[1].replace(/\s+/g, " ").trim()).filter(Boolean);

const perFile = [];
for (const cssFile of cssFiles) {
  const raw = readFileSync(`dist/assets/${cssFile}`, "utf8");
  const run = async (extractor) => {
    const r = await new PurgeCSS().purge({
      content: contentFiles,
      css: [{ raw }],
      defaultExtractor: extractor,
      safelist: CSS_SAFELIST,
    });
    return r[0].css;
  };
  const [a, b] = [await run(current), await run(fixed)];
  const sa = new Set(selectorsOf(a));
  const sb = selectorsOf(b);
  const revived = [...new Set(sb)].filter((s) => !sa.has(s));
  if (revived.length) perFile.push({ cssFile, bytes: [a.length, b.length], revived });
}

const totalRevived = perFile.reduce((n, f) => n + f.revived.length, 0);
const before = perFile.reduce((n, f) => n + f.bytes[0], 0);
const after = perFile.reduce((n, f) => n + f.bytes[1], 0);
console.log(`règles revenues: ${totalRevived} · CSS purgé ${(before / 1024).toFixed(0)} kB → ${(after / 1024).toFixed(0)} kB (+${((after - before) / 1024).toFixed(1)} kB)`);
for (const f of perFile) {
  console.log(`\n## ${f.cssFile} (+${((f.bytes[1] - f.bytes[0]) / 1024).toFixed(1)} kB)`);
  console.log(f.revived.slice(0, 40).map((s) => "   " + s.slice(0, 110)).join("\n"));
}
writeFileSync(".scratch-diag/purge-revived.json", JSON.stringify(perFile, null, 2));
