import { readdir, readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";

const DIST_DIR = path.resolve("dist");
const DIST_ASSETS_DIR = path.join(DIST_DIR, "assets");
const MANIFEST_PATH = path.join(DIST_DIR, ".vite", "manifest.json");

const LIMITS = {
  // Responsive reader, reciter profiles and the compact player add route-only
  // CSS. Keep a narrow baseline above the measured production bundle.
  css: Number(process.env.BUDGET_CSS_KB || 907),
  // Legal, PWA, audio and reader features remain route-split while the shared
  // design tokens load with the initial shell to prevent a theme flash.
  js: Number(process.env.BUDGET_JS_KB || 1275),
  total: Number(process.env.BUDGET_TOTAL_KB || 2175),
  singleCss: Number(process.env.BUDGET_SINGLE_CSS_KB || 395),
  singleJs: Number(process.env.BUDGET_SINGLE_JS_KB || 225),
  initialCss: Number(process.env.BUDGET_INITIAL_CSS_KB || 395),
  initialJs: Number(process.env.BUDGET_INITIAL_JS_KB || 418),
  initialTotal: Number(process.env.BUDGET_INITIAL_TOTAL_KB || 810),
  initialGzip: Number(process.env.BUDGET_INITIAL_GZIP_KB || 200),
  deferredCss: Number(process.env.BUDGET_DEFERRED_CSS_KB || 186),
  homeCss: Number(process.env.BUDGET_HOME_CSS_KB || 58),
  readerCss: Number(process.env.BUDGET_READER_CSS_KB || 180),
};

const kb = (bytes) => bytes / 1024;
const formatKb = (bytes) => `${kb(bytes).toFixed(1)} kB`;

async function listFiles(dir) {
  const entries = await readdir(dir);
  return entries.map((name) => path.join(dir, name));
}

async function getAssetStats(files) {
  let cssBytes = 0;
  let jsBytes = 0;
  let largestCss = null;
  let largestJs = null;

  for (const file of files) {
    if (!file.endsWith(".css") && !file.endsWith(".js")) continue;
    const info = await stat(file);
    const asset = { file: path.basename(file), size: info.size };
    if (file.endsWith(".css")) {
      cssBytes += info.size;
      if (!largestCss || info.size > largestCss.size) largestCss = asset;
    } else {
      jsBytes += info.size;
      if (!largestJs || info.size > largestJs.size) largestJs = asset;
    }
  }

  return { cssBytes, jsBytes, largestCss, largestJs };
}

function collectStaticEntryFiles(manifest, entryKey) {
  const visited = new Set();
  const files = new Set();

  function visit(key) {
    if (visited.has(key)) return;
    const entry = manifest[key];
    if (!entry) return;
    visited.add(key);
    if (entry.file) files.add(entry.file);
    for (const cssFile of entry.css || []) files.add(cssFile);
    for (const importedKey of entry.imports || []) visit(importedKey);
  }

  visit(entryKey);
  return files;
}

async function measureManifestFiles(relativeFiles) {
  let cssBytes = 0;
  let jsBytes = 0;
  let gzipBytes = 0;

  for (const relativeFile of relativeFiles) {
    const content = await readFile(path.join(DIST_DIR, relativeFile));
    if (relativeFile.endsWith(".css")) cssBytes += content.length;
    if (relativeFile.endsWith(".js")) jsBytes += content.length;
    if (relativeFile.endsWith(".css") || relativeFile.endsWith(".js")) {
      gzipBytes += gzipSync(content).length;
    }
  }

  return { cssBytes, jsBytes, gzipBytes, totalBytes: cssBytes + jsBytes };
}

async function measureEntryCss(manifest, entryKey) {
  const entry = manifest[entryKey];
  if (!entry) return null;
  const cssFiles = new Set(entry.css || []);
  if (entry.file?.endsWith(".css")) cssFiles.add(entry.file);
  const measurement = await measureManifestFiles(cssFiles);
  return measurement.cssBytes;
}

let files;
let manifest;
try {
  [files, manifest] = await Promise.all([
    listFiles(DIST_ASSETS_DIR),
    readFile(MANIFEST_PATH, "utf8").then(JSON.parse),
  ]);
} catch (error) {
  console.error("[budget] Build assets or Vite manifest are missing. Run npm run build first.");
  console.error(`[budget] ${error?.message || error}`);
  process.exit(1);
}

const entryKey = manifest["index.html"]
  ? "index.html"
  : Object.keys(manifest).find((key) => manifest[key]?.isEntry);
if (!entryKey) {
  console.error("[budget] Unable to locate the application entry in the Vite manifest.");
  process.exit(1);
}

const aggregate = await getAssetStats(files);
const initial = await measureManifestFiles(
  collectStaticEntryFiles(manifest, entryKey),
);
const routeCss = {
  deferred: await measureEntryCss(manifest, "src/styles/deferredStyles.js"),
  home: await measureEntryCss(manifest, "src/components/HomePage.jsx"),
  reader: await measureEntryCss(manifest, "src/components/QuranDisplay.jsx"),
};

const aggregateTotal = aggregate.cssBytes + aggregate.jsBytes;
console.log(`[budget] Aggregate CSS: ${formatKb(aggregate.cssBytes)} (limit ${LIMITS.css} kB)`);
console.log(`[budget] Aggregate JS: ${formatKb(aggregate.jsBytes)} (limit ${LIMITS.js} kB)`);
console.log(`[budget] Aggregate CSS+JS: ${formatKb(aggregateTotal)} (limit ${LIMITS.total} kB)`);
console.log(
  `[budget] Initial entry: ${formatKb(initial.totalBytes)} ` +
    `(JS ${formatKb(initial.jsBytes)}, CSS ${formatKb(initial.cssBytes)}, gzip ${formatKb(initial.gzipBytes)})`,
);
if (aggregate.largestCss) {
  console.log(
    `[budget] Largest CSS: ${aggregate.largestCss.file} ` +
      `(${formatKb(aggregate.largestCss.size)}, limit ${LIMITS.singleCss} kB)`,
  );
}
if (aggregate.largestJs) {
  console.log(
    `[budget] Largest JS: ${aggregate.largestJs.file} ` +
      `(${formatKb(aggregate.largestJs.size)}, limit ${LIMITS.singleJs} kB)`,
  );
}
for (const [name, bytes] of Object.entries(routeCss)) {
  if (bytes === null) continue;
  const limit = LIMITS[`${name}Css`];
  console.log(`[budget] ${name} CSS: ${formatKb(bytes)} (limit ${limit} kB)`);
}

const failures = [];
function assertLimit(label, bytes, limitKb) {
  const actualKb = kb(bytes);
  if (actualKb > limitKb) {
    failures.push(`${label} exceeded by ${(actualKb - limitKb).toFixed(1)} kB`);
  }
}

assertLimit("Aggregate CSS", aggregate.cssBytes, LIMITS.css);
assertLimit("Aggregate JS", aggregate.jsBytes, LIMITS.js);
assertLimit("Aggregate CSS+JS", aggregateTotal, LIMITS.total);
assertLimit("Largest CSS asset", aggregate.largestCss?.size || 0, LIMITS.singleCss);
assertLimit("Largest JS asset", aggregate.largestJs?.size || 0, LIMITS.singleJs);
assertLimit("Initial CSS", initial.cssBytes, LIMITS.initialCss);
assertLimit("Initial JS", initial.jsBytes, LIMITS.initialJs);
assertLimit("Initial CSS+JS", initial.totalBytes, LIMITS.initialTotal);
assertLimit("Initial gzip", initial.gzipBytes, LIMITS.initialGzip);
if (routeCss.deferred !== null) assertLimit("Deferred CSS", routeCss.deferred, LIMITS.deferredCss);
if (routeCss.home !== null) assertLimit("Home CSS", routeCss.home, LIMITS.homeCss);
if (routeCss.reader !== null) assertLimit("Reader CSS", routeCss.reader, LIMITS.readerCss);

if (failures.length > 0) {
  for (const failure of failures) console.error(`[budget] ${failure}`);
  process.exit(1);
}

console.log("[budget] OK");
