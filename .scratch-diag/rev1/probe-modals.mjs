import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";
const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));
await page.goto(BASE + "/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 15; i++) {
  if (await page.evaluate(() => !!document.querySelector("[data-ayah-number], .qc-list-card"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(1500);

const up = (sel) => page.evaluate((s) => !!document.querySelector(s), sel);

// Search: Ctrl+K then a single Escape.
await page.keyboard.press("Control+k");
await page.waitForTimeout(900);
log("search open:", await up(".search-pro"));
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
log("search after Escape:", await up(".search-pro"));
await page.waitForTimeout(1500);
log("search 1.5s later:", await up(".search-pro"));

// Library from the header menu.
await page.click('header button[aria-label="Plus d\'options"]');
await page.waitForTimeout(600);
const lib = await page.evaluate(() => {
  const m = [...document.querySelectorAll("[role='menuitem'],[role='menuitemradio'],button")].find((x) => x.offsetParent && /bibliothèque|library/i.test(x.textContent || ""));
  if (!m) return null;
  m.setAttribute("data-probe-lib", "1");
  return m.textContent.trim();
});
log("library item:", lib);
if (lib) {
  await page.click("[data-probe-lib]");
  await page.waitForTimeout(1200);
  const before = await page.evaluate(() => document.querySelector("header h1, header h2")?.textContent?.trim());
  log("library open:", await up(".library-modal, .library-panel, [class*='library']"));
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(900);
  log("arrows behind library:", before === (await page.evaluate(() => document.querySelector("header h1, header h2")?.textContent?.trim())) ? "BLOCKED" : "LEAKED");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1600);
  log("library after Escape:", await up(".library-modal, .library-panel"));
}
await browser.close();
