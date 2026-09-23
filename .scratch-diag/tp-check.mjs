import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false, displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs", quranFontSize: 34, lang: "fr", theme: "light", lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
});
await page.goto(process.env.BASE_URL || "http://127.0.0.1:4194/", { waitUntil: "domcontentloaded" });
await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1500);
console.log(JSON.stringify(await page.evaluate(() => {
  const els = [...document.querySelectorAll('.app-root [class*="text-primary"]')];
  const probe = document.createElement("span");
  probe.className = "text-[var(--text-primary)]";
  document.querySelector(".app-root").appendChild(probe);
  const probeColor = getComputedStyle(probe).color;
  probe.remove();
  return {
    theme: document.documentElement.dataset.theme,
    matches: els.length,
    sample: els.slice(0, 4).map((e) => ({ cls: e.className.slice(0, 50), color: getComputedStyle(e).color })),
    probeColor,
    varDefined: getComputedStyle(document.documentElement).getPropertyValue("--mp-light-primary"),
  };
})));
await browser.close();
