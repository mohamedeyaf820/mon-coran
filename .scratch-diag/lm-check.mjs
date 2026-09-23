import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((a) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false, displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs", quranFontSize: 34, lang: "fr", theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } }));
  }, { theme });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  console.log(theme, JSON.stringify(await page.evaluate(() => {
    const out = [];
    for (const b of document.querySelectorAll("button")) {
      if (!/Charger plus|Load more|Voir plus/.test((b.textContent || "").trim())) continue;
      const s = getComputedStyle(b);
      out.push({ t: b.textContent.trim().slice(0, 20), color: s.color, bg: s.backgroundColor, cls: b.className.includes("text-[var(--text-primary)]") });
    }
    return out;
  })));
  await ctx.close();
}
await browser.close();
