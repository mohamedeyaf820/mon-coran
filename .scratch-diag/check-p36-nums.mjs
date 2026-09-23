import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "fr", riwaya: "warsh",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false, warshStrictMode: true,
  showTranslation: true, translationLangs: ["en.pickthall-warsh"],
})));
await page.goto("http://127.0.0.1:4173/page/36", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 25000 });
await page.waitForTimeout(4000);
const dump = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("[data-warsh-number], [data-ayah-number], [data-ayah]").forEach((el) => {
    const t = el.querySelector("[class*=translation]")?.textContent?.trim();
    if (t) out.push({ n: el.dataset.warshNumber || el.dataset.ayahNumber || el.dataset.ayah, t: t.slice(0, 60) });
  });
  return { context: document.querySelector(".reader-context-card")?.textContent?.replace(/\s+/g, " ").trim()?.slice(0, 120), first: out.slice(0, 5), last: out.slice(-3) };
});
console.log(JSON.stringify(dump, null, 1));
await browser.close();
