import { chromium } from "@playwright/test";
const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript((a) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false, displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs", quranFontSize: 34, lang: "fr", theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
  }, { theme });
  await page.goto(process.env.BASE_URL || "http://127.0.0.1:4194/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(6000);
  const out = await page.evaluate(() => {
    let ruleLoaded = false;
    const scan = (rules) => {
      for (const r of rules) {
        if (r.selectorText && r.selectorText.includes('[class*="text-primary"]')) ruleLoaded = true;
        if (r.cssRules) { try { scan(r.cssRules); } catch {} }
      }
    };
    for (const s of document.styleSheets) { try { scan(s.cssRules); } catch {} }
    const pick = (re) => {
      const b = [...document.querySelectorAll("button")].find((x) => re.test(x.textContent || ""));
      return b ? getComputedStyle(b).color : null;
    };
    return { ruleLoaded, load: pick(/Charger plus/), resume: pick(/Reprendre/), mp: getComputedStyle(document.documentElement).getPropertyValue("--mp-light-primary") };
  });
  console.log(theme, JSON.stringify(out));
  await ctx.close();
}
await browser.close();
