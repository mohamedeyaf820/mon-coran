import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const DIST_ASSETS_DIR = path.resolve("dist/assets");
const MAX_CSS_KB = Number(process.env.BUDGET_CSS_KB || 970);
const MAX_JS_KB = Number(process.env.BUDGET_JS_KB || 950);

async function listFiles(dir) {
  const entries = await readdir(dir);
  return entries.map((name) => path.join(dir, name));
}

async function sumByExtension(files, extension) {
  let totalBytes = 0;
  for (const file of files) {
    if (!file.endsWith(extension)) continue;
    const info = await stat(file);
    totalBytes += info.size;
  }
  return totalBytes;
}

const files = await listFiles(DIST_ASSETS_DIR);
const cssBytes = await sumByExtension(files, ".css");
const jsBytes = await sumByExtension(files, ".js");

const cssKb = cssBytes / 1024;
const jsKb = jsBytes / 1024;

console.log(`[budget] CSS total: ${cssKb.toFixed(1)} kB (limit ${MAX_CSS_KB} kB)`);
console.log(`[budget] JS total: ${jsKb.toFixed(1)} kB (limit ${MAX_JS_KB} kB)`);

const failures = [];
if (cssKb > MAX_CSS_KB) failures.push(`CSS budget exceeded by ${(cssKb - MAX_CSS_KB).toFixed(1)} kB`);
if (jsKb > MAX_JS_KB) failures.push(`JS budget exceeded by ${(jsKb - MAX_JS_KB).toFixed(1)} kB`);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[budget] ${failure}`);
  }
  process.exit(1);
}

console.log("[budget] OK");
