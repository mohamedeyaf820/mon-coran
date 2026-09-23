import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));

await page.goto(BASE + "/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
await page.waitForTimeout(2000);

const openSettings = async () => {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("header button")].find((x) => x.getAttribute("aria-label") === "Plus d'options");
    b?.setAttribute("data-probe-h", "1");
  });
  await page.click("button[data-probe-h]");
  await page.waitForTimeout(800);
  const item = await page.evaluate(() => {
    const m = [...document.querySelectorAll("[role='menuitem'],[role='menuitemradio'],button")].find((x) => x.offsetParent && /réglages?|paramètres?/i.test(x.textContent || ""));
    if (!m) return null;
    m.setAttribute("data-probe-s", "1");
    return m.textContent.trim();
  });
  if (!item) return false;
  await page.click("[data-probe-s]");
  await page.waitForTimeout(1500);
  return page.evaluate(() => !!document.querySelector(".settings-drawer"));
};

const switchState = () => page.evaluate(() => {
  const input = document.querySelector("#settings-auto-night");
  if (!input) return "missing";
  return input.checked ? "on" : "off";
});

log("settings:", await openSettings());
log("auto-night before:", await switchState());
await page.evaluate(() => document.querySelector("#settings-auto-night")?.click());
await page.waitForTimeout(900);
log("auto-night after clicking it:", await switchState());
log("html theme:", await page.evaluate(() => document.documentElement.dataset.theme || document.documentElement.className));

// choose a theme by hand
log("tabs:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll(".settings-tab-button")].map(x => x.textContent.trim()))));
await page.evaluate(() => { document.querySelector(".settings-tab-button")?.click(); });
await page.waitForTimeout(900);
log("tiles:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("[class*=theme]")].map(x => `${x.tagName}.${String(x.className).slice(0,34)}|${(x.getAttribute("aria-label")||x.textContent||"").trim().slice(0,26)}`).slice(0,14))));
const tile = await page.evaluate(() => {
  const all = [...document.querySelectorAll(".settings-theme-tile")];
  const t = all.find((x) => x.getAttribute("data-active") !== "true" && x.getAttribute("aria-pressed") !== "true");
  if (!t) return null;
  t.setAttribute("data-probe-tile", "1");
  return t.getAttribute("aria-label");
});
log("sepia tile:", tile);
if (tile) {
  await page.click("[data-probe-tile]");
  await page.waitForTimeout(1200);
}
log("theme now:", await page.evaluate(() => document.documentElement.dataset.theme || null));
log("auto-night after manual theme:", await switchState(), "(expected off)");
await page.waitForTimeout(3500);
log("theme 3.5s later:", await page.evaluate(() => document.documentElement.dataset.theme || null), "auto-night:", await switchState());
await browser.close();
