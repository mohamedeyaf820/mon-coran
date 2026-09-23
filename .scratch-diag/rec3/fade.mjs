// scratch: did the edge fade survive the CSS purge, and is it legible?
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4394";
const browser = await chromium.launch();
for (const [lang, w] of [["fr", 360], ["ar", 360], ["fr", 600]]) {
  const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: w, height: 880 } });
  await ctx.addInitScript((a) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true, showHome: true, sidebarOpen: false,
      homeSection: "audio", riwaya: "hafs", fontFamily: "qpc-hafs", lang: a.lang, theme: "light",
    }));
    localStorage.setItem("mushaf-plus-onboarded", "1");
  }, { lang });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('.home-content-toolbar [role="tab"]');
  await page.locator('.home-content-toolbar [role="tab"]').nth(2).click();
  await page.waitForTimeout(1800);
  const r = await page.evaluate(() => {
    const s = document.querySelector(".home-style-filters");
    const cs = getComputedStyle(s);
    return {
      mask: cs.maskImage || cs.webkitMaskImage,
      snap: cs.scrollSnapType,
      chipSnap: getComputedStyle(s.querySelector(".home-style-filter")).scrollSnapAlign,
      overflow: s.scrollWidth > s.clientWidth,
    };
  });
  console.log(`${lang}/${w}:`, JSON.stringify(r));
  await page.screenshot({ path: `.scratch-diag/rec3/fade-${lang}-${w}.png`, clip: { x: 0, y: 120, width: w, height: 220 } });
  await ctx.close();
}
await browser.close();
