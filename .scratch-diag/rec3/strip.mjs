// scratch: how much of the chip strip is off-screen on small phones?
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4394";
const browser = await chromium.launch();
for (const [w, lang] of [[360, "fr"], [430, "fr"], [480, "fr"], [520, "fr"], [540, "fr"], [560, "fr"], [600, "fr"], [700, "fr"], [360, "ar"], [560, "ar"]]) {
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
  await page.waitForTimeout(1600);
  const r = await page.evaluate(() => {
    const strip = document.querySelector(".home-style-filters");
    const chips = [...strip.querySelectorAll(".home-style-filter")];
    const sb = strip.getBoundingClientRect();
    return {
      scrollW: strip.scrollWidth, clientW: strip.clientWidth,
      hidden: chips
        .filter((c) => {
          const b = c.getBoundingClientRect();
          return b.right > sb.right + 1 || b.left < sb.left - 1;
        })
        .map((c) => c.textContent.replace(/\s+/g, " ").trim()),
      hintVisible: getComputedStyle(document.querySelector(".home-audio-browser__hint")).display,
    };
  });
  console.log(`${w}px/${lang}: scrollW=${r.scrollW} clientW=${r.clientW} hidden=${JSON.stringify(r.hidden)} hintDisplay=${r.hintVisible}`);
  await ctx.close();
}
await browser.close();
