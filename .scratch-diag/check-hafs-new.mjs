import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "fr", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
})));
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 25000 });
await page.evaluate(() => window.dispatchEvent(new Event("mushafplus-open-audio-options")));
await page.waitForSelector('[data-testid="reciter-option"]', { timeout: 15000 });
await page.waitForTimeout(1500);
const dump = await page.evaluate((wanted) => {
  const items = [...document.querySelectorAll('[data-testid="reciter-option"]')];
  return {
    total: items.length,
    found: items.filter((el) => wanted.includes(el.dataset.reciterId)).map((el) => el.textContent?.replace(/\s+/g, " ").trim().slice(0, 60)),
    labels: items.filter((el) => wanted.includes(el.dataset.reciterId)).map((el) => el.getAttribute("aria-label")),
  };
}, ["abdulbar_althubaity", "saad_almoqren", "ali_hajjaj_alsoaesi"]);
console.log(JSON.stringify(dump, null, 1));
console.log("pageerrors:", errors.length ? errors : "none");
await browser.close();
