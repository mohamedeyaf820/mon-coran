import { readdir, readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";

const DIST_DIR = path.resolve("dist");
const DIST_ASSETS_DIR = path.join(DIST_DIR, "assets");
const MANIFEST_PATH = path.join(DIST_DIR, ".vite", "manifest.json");

const LIMITS = {
  // Responsive reader, reciter profiles and the compact player add route-only
  // CSS. Updated to reflect the current measured production bundle sizes.
  css: Number(process.env.BUDGET_CSS_KB || 1060),
  // Legal, PWA, audio and reader features remain route-split while the shared
  // design tokens load with the initial shell to prevent a theme flash.
  // 2026-09-24: +25 kB for the prayer-times feature (aladhan client, geolocation,
  // home strip, detail modal, notification routines) and the extended share-card
  // studio (3 new presets, occasion badge, dua sharing) — 1297.8 kB measured.
  // 2026-09-24: +7 kB for the share-studio personalisation pass — two palettes,
  // frame / motif / Arabic-scale pickers, card-weight preview and the trilingual
  // label maps. The panel is a lazy chunk, but the aggregate counts every emitted
  // asset; picker glyphs are drawn inline instead of importing more icons and the
  // measured cost is 1306.7 kB.
  // 2026-09-24: +2 kB; the share format picker now states ratio, platform list
  // and a localized hint per format, and the prayer modal gains its next-prayer
  // hero — 1310.6 kB measured.
  // 2026-09-26: +63 kB; /prires tracker, the Prayer settings tab, the adhan
  // service, the prayer log and the notification planner land in this commit
  // (~50 kB of new source), together with the audit campaign's reader error
  // taxonomy, multi-tab guard and the verse-action locale keys they required.
  // The campaign also paid part of it back: audioService.js is split into
  // reciterLatency / audioEq / audioPreload, which brought screen-budget from
  // EXCEEDED (47.2 > 46 kB) back to OK at 45.6 kB. 1369.3 kB measured on CI.
  js: Number(process.env.BUDGET_JS_KB || 1375),
  // 2026-09-20: raised after the purge-config fix restored the [dir=]/[lang=]
  // RTL rules that v8 silently dropped, plus consolidated i18n dictionaries.
  // 2026-09-21: +10 kB for the in-app print-engine sheet (Arabic page
  // furniture, Warsh rule-based tajweed colouring, size wiring).
  // 2026-09-24: +20 kB, prayer-times and share-card features (2302.1 kB measured).
  // 2026-09-24: +15 kB, the share-studio personalisation pass above plus its
  // stylesheet rules (2314.2 kB measured).
  // 2026-09-24: +4 kB, share-format hints, prayer-hero markup and their styles
  // (2321.4 kB measured).
  // 2026-09-26: +76 kB for the same commit as the JS line above: the prayer
  // feature and the audit campaign together, CSS and JS counted once
  // (2393.3 kB measured on CI).
  total: Number(process.env.BUDGET_TOTAL_KB || 2400),
  singleCss: Number(process.env.BUDGET_SINGLE_CSS_KB || 395),
  // 2026-09-26: +10 kB; this chunk carries the boot graph, which now also holds
  // the reader load-error taxonomy (the boundary needs it synchronously), the
  // multi-tab notice and the verse-action locale keys added in three dictionaries.
  // Per-module contribution was not measured; the total is (232.2 kB on CI).
  singleJs: Number(process.env.BUDGET_SINGLE_JS_KB || 235),
  initialCss: Number(process.env.BUDGET_INITIAL_CSS_KB || 395),
  // 2026-09-21: +2 kB headroom; cumulative print-engine and audio campaigns
  // measured 422.3 kB of initial JS against the old 422 cap.
  // 2026-09-23: +1 kB; the tafsir selector now ships language group labels and
  // a Warsh reading note in all three dictionaries (424.3 kB measured).
  // 2026-09-24: +10 kB; trilingual prayer/notification dictionaries and the
  // settings/state wiring load with the shell (434.0 kB measured). The timings
  // API client itself stays out of the boot graph via lazy chunks.
  // 2026-09-24: +2 kB; the trilingual share-format hint strings ship with the
  // dictionaries (435.5 kB measured).
  // 2026-09-26: +25 kB; the boot graph grew by the reader load-error taxonomy,
  // the multi-tab notice and the verse-action locale keys, and by the prayer
  // settings/state wiring that shares the entry chunk. The timings and adhan
  // clients stay out of boot behind lazy chunks (459.5 kB measured on CI).
  initialJs: Number(process.env.BUDGET_INITIAL_JS_KB || 462),
  // 2026-09-26: 813.8 kB measured on CI.
  initialTotal: Number(process.env.BUDGET_INITIAL_TOTAL_KB || 815),
  // 2026-09-26: 204.7 kB measured on CI.
  initialGzip: Number(process.env.BUDGET_INITIAL_GZIP_KB || 206),
  deferredCss: Number(process.env.BUDGET_DEFERRED_CSS_KB || 205),
  // 2026-09-24: +2 kB; the home prayer strip and its modal styles landed in the
  // home sheet (57.1 kB measured against the old 58 cap).
  // 2026-09-26: +2 kB; the strip gained the adhan/prayer-notification controls
  // and the per-prayer reminder rows (61.6 kB measured on CI).
  homeCss: Number(process.env.BUDGET_HOME_CSS_KB || 62),
  readerCss: Number(process.env.BUDGET_READER_CSS_KB || 252),
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
