import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const DIST_ASSETS_DIR = path.resolve("dist/assets");
const MAX_CSS_KB = Number(process.env.BUDGET_CSS_KB || 945);
const MAX_JS_KB = Number(process.env.BUDGET_JS_KB || 940);
const MAX_TOTAL_KB = Number(process.env.BUDGET_TOTAL_KB || 1885);
const MAX_SINGLE_CSS_KB = Number(process.env.BUDGET_SINGLE_CSS_KB || 520);
const MAX_SINGLE_JS_KB = Number(process.env.BUDGET_SINGLE_JS_KB || 210);

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

async function getLargestByExtension(files, extension) {
  let largest = null;
  for (const file of files) {
    if (!file.endsWith(extension)) continue;
    const info = await stat(file);
    if (!largest || info.size > largest.size) {
      largest = { file: path.basename(file), size: info.size };
    }
  }
  return largest;
}

let files = [];
try {
  files = await listFiles(DIST_ASSETS_DIR);
} catch (error) {
  console.error(`[budget] Unable to read ${DIST_ASSETS_DIR}. Run npm.cmd run build first.`);
  console.error(`[budget] ${error?.message || error}`);
  process.exit(1);
}

const cssBytes = await sumByExtension(files, ".css");
const jsBytes = await sumByExtension(files, ".js");
const largestCss = await getLargestByExtension(files, ".css");
const largestJs = await getLargestByExtension(files, ".js");

const cssKb = cssBytes / 1024;
const jsKb = jsBytes / 1024;
const totalKb = cssKb + jsKb;
const largestCssKb = (largestCss?.size || 0) / 1024;
const largestJsKb = (largestJs?.size || 0) / 1024;

console.log(`[budget] CSS total: ${cssKb.toFixed(1)} kB (limit ${MAX_CSS_KB} kB)`);
console.log(`[budget] JS total: ${jsKb.toFixed(1)} kB (limit ${MAX_JS_KB} kB)`);
console.log(`[budget] CSS+JS total: ${totalKb.toFixed(1)} kB (limit ${MAX_TOTAL_KB} kB)`);
if (largestCss) {
  console.log(
    `[budget] Largest CSS asset: ${largestCss.file} (${largestCssKb.toFixed(1)} kB, limit ${MAX_SINGLE_CSS_KB} kB)`,
  );
}
if (largestJs) {
  console.log(
    `[budget] Largest JS asset: ${largestJs.file} (${largestJsKb.toFixed(1)} kB, limit ${MAX_SINGLE_JS_KB} kB)`,
  );
}

const failures = [];
if (cssKb > MAX_CSS_KB) failures.push(`CSS budget exceeded by ${(cssKb - MAX_CSS_KB).toFixed(1)} kB`);
if (jsKb > MAX_JS_KB) failures.push(`JS budget exceeded by ${(jsKb - MAX_JS_KB).toFixed(1)} kB`);
if (totalKb > MAX_TOTAL_KB) failures.push(`CSS+JS budget exceeded by ${(totalKb - MAX_TOTAL_KB).toFixed(1)} kB`);
if (largestCss && largestCssKb > MAX_SINGLE_CSS_KB) {
  failures.push(
    `Largest CSS asset (${largestCss.file}) exceeded by ${(largestCssKb - MAX_SINGLE_CSS_KB).toFixed(1)} kB`,
  );
}
if (largestJs && largestJsKb > MAX_SINGLE_JS_KB) {
  failures.push(
    `Largest JS asset (${largestJs.file}) exceeded by ${(largestJsKb - MAX_SINGLE_JS_KB).toFixed(1)} kB`,
  );
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[budget] ${failure}`);
  }
  process.exit(1);
}

console.log("[budget] OK");
