// scratch probe: cpv-surah-name-tr legibility in the in-app mushaf cover decor
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const SETTINGS_KEY = "mushaf-plus-settings";
const OUT = ".scratch-diag/resp";
const browser = await chromium.launch();

for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 390, height: 780 } });
  await ctx.addInitScript(
    (a) => {
      localStorage.setItem(
        a.key,
        JSON.stringify({
          skipSplashAnimation: true,
          showHome: false,
          sidebarOpen: false,
          displayMode: "surah",
          mushafLayout: "mushaf",
          riwaya: "hafs",
          fontFamily: "qpc-hafs",
          quranFontSize: 34,
          lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
          ...a.ovr,
        }),
      );
    },
    { key: SETTINGS_KEY, ovr: { lang: "fr", theme } },
  );
  const page = await ctx.newPage();
  await page.goto(BASE + "/surah/2", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector(".hp-card, .app-view-reading", { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const cont = page.locator("button", { hasText: /Continuer/ }).first();
  if (await cont.isVisible().catch(() => false)) {
    await cont.click().catch(() => {});
    await page.waitForTimeout(1800);
  }
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);

  for (const w of [280, 390, 1280]) {
    await page.setViewportSize({ width: w, height: w < 500 ? 780 : 1000 });
    await page.waitForTimeout(500);
    const info = await page.evaluate(() => {
      const els = [...document.querySelectorAll(".cpv-surah-name-tr")];
      return els.map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const box = el.closest(".cpv-surah-title-box, .cpv-surah-name-ar")?.getBoundingClientRect();
        return {
          txt: (el.textContent || "").trim().slice(0, 20),
          fs: cs.fontSize,
          root: getComputedStyle(document.documentElement).fontSize,
          w: Math.round(r.width),
          h: Math.round(r.height),
          sw: el.scrollWidth,
          box: box ? { w: Math.round(box.width), h: Math.round(box.height) } : null,
        };
      });
    });
    console.log(theme, w, JSON.stringify(info));
    const target = page.locator(".cpv-surah-title-box, .cpv-surah-name-ar").first();
    if (await target.count()) {
      await target
        .screenshot({ path: `${OUT}/cpv-${theme}-${w}.png`, timeout: 8000 })
        .catch(async () => {
          await page.screenshot({ path: `${OUT}/cpv-${theme}-${w}.png`, timeout: 8000 }).catch(() => {});
        });
    }
  }
  await ctx.close();
}
await browser.close();
