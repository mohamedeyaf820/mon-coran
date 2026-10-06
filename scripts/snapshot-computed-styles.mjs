// Dumps the computed style of every element of the main screens (production
// build on :4173) so two builds can be compared byte for byte. Used to prove a
// CSS refactor changed nothing. Usage: node scripts/snapshot-computed-styles.mjs out.json
import fs from "node:fs";
import { chromium } from "playwright";
import { installQuranNetworkFixtures } from "../tests/e2e/helpers/quran-network-fixtures.mjs";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4173";
const out = process.argv[2];
const SCREENS = [
  ["home", "/", { showHome: true }],
  ["list", "/surah/2", { showHome: false, displayMode: "surah", mushafLayout: "list" }],
  ["mushaf", "/surah/2", { showHome: false, displayMode: "surah", mushafLayout: "mushaf" }],
  ["page", "/page/50", { showHome: false, displayMode: "page" }],
  ["warsh", "/surah/3", { showHome: false, riwaya: "warsh", displayMode: "surah" }],
  ["prayers", "/", { showHome: false, showPrayers: true }],
];
const VARIANTS = [
  { viewport: { width: 390, height: 844 }, theme: "light", lang: "fr" },
  { viewport: { width: 1280, height: 900 }, theme: "dark", lang: "fr" },
  { viewport: { width: 820, height: 1000 }, theme: "sepia", lang: "ar" },
];
const browser = await chromium.launch();
const result = {};
for (const [variantIndex, variant] of VARIANTS.entries()) {
  if (process.env.VARIANT && Number(process.env.VARIANT) !== variantIndex) continue;
  const context = await browser.newContext({ viewport: variant.viewport, serviceWorkers: "block", reducedMotion: "reduce" });
  for (const [name, url, settings] of SCREENS) {
    const page = await context.newPage();
    await installQuranNetworkFixtures(page);
    await page.addInitScript((s) => localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, ...s })), { ...settings, theme: variant.theme, lang: variant.lang });
    await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#main-content", { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(Number(process.env.SETTLE_MS || 2500));
    await page.evaluate(() => { window.__dumpBody = true; });
    result[`${variant.viewport.width}-${variant.theme}-${name}`] = await page.evaluate(() => {
      const rows = [];
      const walk = (el, path) => {
        const cs = getComputedStyle(el);
        const props = [];
        for (let i = 0; i < cs.length; i += 1) props.push(`${cs[i]}:${cs.getPropertyValue(cs[i])}`);
        // FNV-1a keeps the dump small; the path locates a changed element.
        let hash = 2166136261;
        const text = props.sort().join(";");
        for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
        rows.push(`${path} ${hash.toString(36)}`);
        if (path === "body" && window.__dumpBody) window.__bodyProps = props;
        let i = 0;
        for (const child of el.children) walk(child, `${path}>${child.tagName}${i++}`);
      };
      walk(document.body, "body");
      return rows;
    });
    if (process.env.BODY_DUMP && name === "home") fs.writeFileSync(process.env.BODY_DUMP + variant.viewport.width, JSON.stringify(await page.evaluate(() => window.__bodyProps)));
    await page.close();
  }
  await context.close();
}
await browser.close();
fs.writeFileSync(out, JSON.stringify(result));
console.log("snapshot", out, Object.entries(result).map(([k, v]) => `${k}:${v.length}`).join(" "));
