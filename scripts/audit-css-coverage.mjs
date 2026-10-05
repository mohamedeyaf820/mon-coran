// Real-browser CSS coverage of the production build (run `npm run build` and
// `npx vite preview --port 4173` first). Reports, per shipped stylesheet, how
// many bytes of rules matched anything while visiting the main screens at a
// phone and a desktop width. It is a map for pruning, not proof a rule is dead:
// states the tour does not reach (errors, offline, dialogs) stay "unused".
import { chromium } from "playwright";
import { installQuranNetworkFixtures } from "../tests/e2e/helpers/quran-network-fixtures.mjs";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4173";
const TOUR = [
  ["home", "/", { showHome: true }],
  ["reader-list", "/surah/2", { showHome: false, displayMode: "surah", mushafLayout: "list" }],
  ["reader-mushaf", "/surah/2", { showHome: false, displayMode: "surah", mushafLayout: "mushaf" }],
  ["reader-page", "/page/50", { showHome: false, displayMode: "page" }],
  ["reader-warsh", "/surah/2", { showHome: false, riwaya: "warsh", displayMode: "surah" }],
  ["duas", "/", { showHome: false, showDuas: true }],
  ["prayers", "/", { showHome: false, showPrayers: true }],
  ["audio-home", "/", { showHome: true, homeSection: "audio" }],
  ["not-found", "/no-such-page", { showHome: false }],
];
// Overlays reached from the shell. Each step is best effort: a control missing
// at one width is skipped, never fatal.
const OVERLAYS = ["search", "settings", "library", "directory"];
const VIEWPORTS = [{ width: 390, height: 844 }, { width: 1280, height: 900 }];
const THEMES = (process.env.THEMES || "light,dark").split(",");

async function openOverlay(page, width, tool) {
  try {
    if (width <= 1024) {
      await page.locator("#main-content").click({ position: { x: 4, y: 180 }, timeout: 2000 }).catch(() => {});
      await page.locator('.mobile-navigation [data-destination="more"]').click({ timeout: 2000 });
      await page.locator(`.mobile-navigation-menu [data-tool="${tool}"]`).click({ timeout: 2000 });
    } else {
      const direct = { search: ".mp-header__search", settings: ".mp-header__settings" }[tool];
      if (direct && await page.locator(direct).first().isVisible().catch(() => false)) await page.locator(direct).first().click({ timeout: 2000 });
      else {
        await page.locator(".mp-header__more").first().click({ timeout: 2000 });
        await page.locator(`.mp-header-menu__item[data-key="${tool === "directory" ? "surahs" : tool}"]`).click({ timeout: 2000 });
      }
    }
    await page.waitForTimeout(900);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  } catch { /* control not reachable at this width */ }
}

async function openVerseActions(page) {
  try {
    await page.locator(".native-ayah-marker, .qc-list-card__start").first().click({ timeout: 2000 });
    await page.waitForTimeout(700);
    await page.keyboard.press("Escape");
  } catch { /* none */ }
}

const browser = await chromium.launch();
const totals = new Map();
for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  const page = await context.newPage();
  await installQuranNetworkFixtures(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const sheets = new Map();
  cdp.on("CSS.styleSheetAdded", ({ header }) => sheets.set(header.styleSheetId, header));
  await cdp.send("CSS.startRuleUsageTracking");
  // Tracking is per document: harvest after every screen, then start again.
  const harvest = async () => {
    const { ruleUsage } = await cdp.send("CSS.stopRuleUsageTracking");
    for (const rule of ruleUsage) {
      const header = sheets.get(rule.styleSheetId);
      if (!header?.sourceURL?.endsWith(".css")) continue;
      const entry = totals.get(header.sourceURL) || { length: header.length, ranges: new Map() };
      const key = `${rule.startOffset}-${rule.endOffset}`;
      entry.ranges.set(key, (entry.ranges.get(key) || false) || rule.used);
      totals.set(header.sourceURL, entry);
    }
    await cdp.send("CSS.startRuleUsageTracking");
  };
  for (const theme of THEMES) {
    for (const [name, url, settings] of TOUR) {
      await page.addInitScript((s) => localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, lang: "fr", ...s })), { theme, ...settings });
      await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("#main-content", { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(1500);
      if (name === "reader-list" || name === "home") {
        for (const tool of OVERLAYS) await openOverlay(page, viewport.width, tool);
      }
      if (name === "reader-list") await openVerseActions(page);
      await harvest();
      console.error(`[coverage] ${viewport.width}px ${theme} ${name}`);
    }
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
