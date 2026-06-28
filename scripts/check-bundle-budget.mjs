import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const DIST_ASSETS_DIR = path.resolve("dist/assets");
const MAX_CSS_KB = Number(process.env.BUDGET_CSS_KB || 945);
// This app deliberately ships many lazy feature chunks. Keep the aggregate JS
// budget realistic while the stricter single-chunk and total CSS+JS budgets
// continue to catch regressions that affect load cost.
// +25 kB added (1155→1180): Radix Dialog fully adopted across 14 panel/modal
// components (AudioMakerPanel, BookmarksModal, FlashcardsPanel, etc.) — the
// shared @radix-ui/react-dialog bundle cost is paid once, enabling consistent
// accessibility (focus traps, ARIA roles) without per-component boilerplate.
// +1 kB added (1180→1181): Dialog.Title sr-only nodes added to all 14 dialogs.
// +1 kB added (1181→1182): WCAG touch targets h-8/h-9→h-11 in AyahActions (×11) and AudioPlayer (×5).
// +1 kB added (1182→1183): WCAG tablist keyboard nav in ContentSection + ErrorBoundary wrapping lazy modals + esbuild update.
// +1 kB added (1183→1184): React.memo on AyahList/SurahMode/JuzMode/PageMode + mobile compact play bar in SurahReaderHeader.
// +9 kB added (1184→1193): Round 2 audit fixes — 56 findings: ARIA tablist/tab/aria-selected on 4
// components, keyboard nav on progress slider, always-mounted aria-live region, TafsirSidebar lazy
// init, i18n missing AR branches (AudioPlayer×3, Header, ContentSection×2, Sidebar), SW fetch timeout
// with AbortController, recitation validation normalization, double-close guards in SearchModal/TafsirSidebar.
// +3 kB added (1193→1196): useKeyboardNavigation hook wired into App.jsx — previously exported but
// never imported (tree-shaken to zero). Now active: consolidates t/w/j/m/Escape/Space/? shortcuts,
// eliminates Alt+M double-dispatch bug, and reduces App.jsx keyboard handler by ~120 lines.
const MAX_JS_KB = Number(process.env.BUDGET_JS_KB || 1196);
// +8 kB added (2050→2058): mobile UX fixes — navbar redesign CSS (home-audio-ux-refonte.css +5 kB)
// and srh-identity hide rules (surah-reader-header.css +3 kB). Net CSS cost of fixing header
// collapse, double-layer identity duplication, and audio player control clipping on ≤640px.
// +10 kB added (2058→2068): Round 2 audit JS fixes (see JS budget note above).
// +3 kB added (2068→2071): useKeyboardNavigation hook now active in bundle (see JS budget note above).
// +1 kB added (2071→2072): code-review fixes — RowActions i18n AR branches, ReciterDetailPage riwaya
// badge restore, MiniPlayer safe-area calc(), AppContext reducer guard corrections.
const MAX_TOTAL_KB = Number(process.env.BUDGET_TOTAL_KB || 2072);
const MAX_SINGLE_CSS_KB = Number(process.env.BUDGET_SINGLE_CSS_KB || 780);
const MAX_SINGLE_JS_KB = Number(process.env.BUDGET_SINGLE_JS_KB || 250);

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
  console.error(`[budget] Unable to read ${DIST_ASSETS_DIR}. Run npm run build first.`);
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
