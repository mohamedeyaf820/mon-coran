import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));

async function load(path) {
  await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  for (let i = 0; i < 20; i++) {
    if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break;
    await page.waitForTimeout(2000);
  }
  await page.waitForTimeout(2500);
}

const riwaya = () => page.evaluate(() => document.querySelector('button[aria-label^="Changer de riwaya"]')?.getAttribute("aria-label"));
const verseNumbers = () => page.evaluate(() => [...document.querySelectorAll("[data-ayah-number]")].slice(0, 4).map((x) => x.getAttribute("data-ayah-number")));

await load("/surah/2");
log("riwaya:", await riwaya(), "first verses:", JSON.stringify(await verseNumbers()));

// open the tafsir of the 3rd displayed verse (2:3 in Hafs)
async function openTafsir(index) {
  await page.evaluate((i) => {
    const b = [...document.querySelectorAll('button[aria-label="Options du verset"]')][i];
    b.setAttribute("data-probe-o", "1");
  }, index);
  await page.click("button[data-probe-o]");
  await page.waitForTimeout(700);
  const item = await page.evaluate(() => {
    const m = [...document.querySelectorAll("[role='menuitem'],[role='menuitemradio']")].find((x) => /tafsir/i.test(x.textContent));
    if (!m) return null;
    m.setAttribute("data-probe-t", "1");
    return m.textContent.trim();
  });
  if (!item) return null;
  await page.click("[data-probe-t]");
  await page.waitForTimeout(1500);
  return page.evaluate(() => ({
    title: document.querySelector("#tafsir-sidebar-title")?.textContent?.trim(),
    attribution: [...document.querySelectorAll("a")].map((a) => a.textContent.trim()).find((t) => /Quran\.com \d/.test(t)) ?? null,
    href: [...document.querySelectorAll("a")].find((a) => /quran\.com/.test(a.href))?.href ?? null,
  }));
}

log("Hafs tafsir on displayed verse #3:", JSON.stringify(await openTafsir(2)));
await page.keyboard.press("Escape");
await page.waitForTimeout(800);

// switch to Warsh
await page.evaluate(() => document.querySelector('button[aria-label^="Changer de riwaya"]').click());
await page.waitForTimeout(4000);
for (let i = 0; i < 20; i++) {
  if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(3000);
log("riwaya now:", await riwaya(), "first verses:", JSON.stringify(await verseNumbers()));
log("Warsh tafsir on displayed verse #3:", JSON.stringify(await openTafsir(2)));
await page.screenshot({ path: ".scratch-diag/rev1/tafsir-warsh.png" });
await browser.close();
