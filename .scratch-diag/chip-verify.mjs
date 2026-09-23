// Scratch: verify the Meccan/Medinan chips render with their tint. Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  for (const w of [390, 1024]) {
    for (const lang of ["fr", "ar"]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
      const page = await ctx.newPage();
      await page.addInitScript((a) => localStorage.setItem(a.k, JSON.stringify({
        skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
        displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
        quranFontSize: 34, lang: a.lang, theme: a.theme, lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), { k: KEY, lang, theme });
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(800);
      const r = await page.evaluate(() => [...document.querySelectorAll(".hp-card-type")].slice(0, 2).map((e) => {
        const cs = getComputedStyle(e);
        return { t: e.innerText.trim(), bg: cs.backgroundColor, col: cs.color, px: cs.paddingInline, fs: cs.fontSize };
      }));
      const dead = await page.evaluate(() => [...document.querySelectorAll(".hp-card-type")].filter((e) => getComputedStyle(e).backgroundColor === "rgba(0, 0, 0, 0)").length);
      console.log(`${theme} ${w}px ${lang} chips=${r.length} dead=${dead} ` + JSON.stringify(r));
      if (lang === "fr") {
        const el = await page.$(".hp-card-type");
        if (el) {
          await el.scrollIntoViewIfNeeded();
          await page.waitForTimeout(150);
          const b = await el.boundingBox();
          const x = Math.max(0, b.x - 60);
          const y = Math.max(0, b.y - 14);
          await page.screenshot({ path: `.scratch-diag/resp/chip-${theme}-${w}.png`, clip: { x, y, width: Math.min(w - x, 320), height: Math.min(34, 900 - y) } });
        }
      }
      await ctx.close();
    }
  }
}
await browser.close();
