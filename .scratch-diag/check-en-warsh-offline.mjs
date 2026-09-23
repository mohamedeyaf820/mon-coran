import { chromium } from "playwright";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "fr", riwaya: "warsh",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false, warshStrictMode: true,
  showTranslation: true, translationLangs: ["en.pickthall-warsh"],
})));
const page = await context.newPage();
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 25000 });
await page.waitForTimeout(3000);
await context.setOffline(true);
await page.goto("http://127.0.0.1:4173/page/42", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(6000);
const dump = await page.evaluate(() => {
  const texts = [...document.querySelectorAll("[class*=translation]")]
    .map((el) => el.textContent?.trim())
    .filter((t) => t && t.length > 20);
  const unique = [...new Set(texts)];
  return {
    count: unique.length,
    kurs: unique.find((t) => /no deity save Him/i.test(t))?.slice(0, 90) ?? null,
  };
});
console.log(JSON.stringify(dump));
await page.screenshot({ path: ".scratch-diag/en-warsh-kursi-offline.png" });
await browser.close();
