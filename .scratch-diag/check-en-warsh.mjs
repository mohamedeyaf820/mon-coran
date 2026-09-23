import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "fr", riwaya: "warsh",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false, warshStrictMode: true,
  showTranslation: true, translationLangs: ["en.pickthall-warsh"],
})));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 25000 });
await page.waitForTimeout(4000);
const dump = await page.evaluate(() => {
  const texts = [...document.querySelectorAll(".translation-text, .ayah-translation, [class*=translation]")]
    .map((el) => el.textContent?.trim())
    .filter((t) => t && t.length > 20);
  return { count: texts.length, sample: texts.slice(0, 4), hasFr: texts.some((t) => /Louange|Allah, Seigneur/i.test(t)), hasEn: texts.some((t) => /Praise be to Allah|Lord of the Worlds/i.test(t)) };
});
console.log(JSON.stringify(dump, null, 1));
await page.screenshot({ path: ".scratch-diag/en-warsh-p3.png", fullPage: false });
await browser.close();
