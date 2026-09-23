import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "fr", riwaya: "warsh",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false, warshStrictMode: true,
  showTranslation: true, translationLangs: ["en.pickthall-warsh"],
})));
await page.goto("http://127.0.0.1:4173/page/42", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 25000 });
await page.waitForTimeout(4000);
const dump = await page.evaluate(() => {
  const items = [...document.querySelectorAll("[data-ayah-number]")].map((el) => ({
    s: el.dataset.surahNumber, a: el.dataset.ayahNumber,
    t: el.querySelector("[class*=translation]")?.textContent?.trim()?.slice(0, 60) ?? null,
  }));
  return { badge: document.querySelector(".reader-context-card__riwaya")?.textContent?.trim(), items };
});
console.log(JSON.stringify(dump, null, 1));
await browser.close();
