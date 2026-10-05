// Real-browser CSS coverage of the production build (run `npm run build` and
// `npx vite preview --port 4173` first). Reports, per shipped stylesheet, how
// many bytes of rules matched anything while visiting the main screens at a
// phone and a desktop width. It is a map for pruning, not proof a rule is dead:
// states the tour does not reach (errors, offline, dialogs) stay "unused".
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4173";
const TOUR = [
  ["home", "/", { showHome: true }],
  ["reader-list", "/surah/2", { showHome: false, displayMode: "surah", mushafLayout: "list" }],
  ["reader-mushaf", "/surah/2", { showHome: false, displayMode: "surah", mushafLayout: "mushaf" }],
  ["reader-page", "/page/50", { showHome: false, displayMode: "page" }],
  ["reader-warsh", "/surah/2", { showHome: false, riwaya: "warsh", displayMode: "surah" }],
];
const VIEWPORTS = [{ width: 390, height: 844 }, { width: 1280, height: 900 }];

const browser = await chromium.launch();
const totals = new Map();
for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const sheets = new Map();
  cdp.on("CSS.styleSheetAdded", ({ header }) => sheets.set(header.styleSheetId, header));
  await cdp.send("CSS.startRuleUsageTracking");
  for (const [name, url, settings] of TOUR) {
    await page.addInitScript((s) => localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, lang: "fr", theme: "light", ...s })), settings);
    await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#main-content", { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2500);
    console.error(`[coverage] ${viewport.width}px ${name}`);
  }
  const { ruleUsage } = await cdp.send("CSS.stopRuleUsageTracking");
  for (const rule of ruleUsage) {
    const header = sheets.get(rule.styleSheetId);
    if (!header?.sourceURL?.endsWith(".css")) continue;
    const entry = totals.get(header.sourceURL) || { length: header.length, ranges: new Map() };
    const key = `${rule.startOffset}-${rule.endOffset}`;
    entry.ranges.set(key, (entry.ranges.get(key) || false) || rule.used);
    totals.set(header.sourceURL, entry);
  }
  await context.close();
}
await browser.close();

const rows = [...totals].map(([url, { length, ranges }]) => {
  let used = 0;
  for (const [key, flag] of ranges) if (flag) { const [a, b] = key.split("-").map(Number); used += b - a; }
  return { file: url.split("/").pop(), kB: +(length / 1024).toFixed(1), usedKB: +(used / 1024).toFixed(1) };
}).sort((a, b) => b.kB - a.kB);
console.table(rows.map((r) => ({ ...r, unusedPct: Math.round(100 - (r.usedKB / r.kB) * 100) })));
