// scratch: element screenshots of the chip strip, to judge the fade
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4394";
const browser = await chromium.launch();
for (const [lang, w, riwaya] of [["fr", 360, "hafs"], ["ar", 360, "hafs"], ["fr", 360, "warsh"], ["fr", 1440, "hafs"]]) {
  const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: w, height: 880 } });
  await ctx.addInitScript((a) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true, showHome: true, sidebarOpen: false,
      homeSection: "audio", riwaya: a.riwaya, fontFamily: "qpc-hafs", lang: a.lang, theme: "light",
    }));
    localStorage.setItem("mushaf-plus-onboarded", "1");
  }, { lang, riwaya });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('.home-content-toolbar [role="tab"]');
  await page.locator('.home-content-toolbar [role="tab"]').nth(2).click();
  await page.waitForSelector(".home-style-filters", { timeout: 20000 });
  await page.waitForTimeout(1200);
  const strip = page.locator(".home-style-filters");
  await strip.screenshot({ path: `.scratch-diag/rec3/strip-${lang}-${riwaya}-${w}.png` });
  await page.screenshot({ path: `.scratch-diag/rec3/full-${lang}-${riwaya}-${w}.png` });
  console.log(`shot ${lang}/${riwaya}/${w}`);
  await ctx.close();
}
await browser.close();
