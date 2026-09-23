// scratch: verify the fullscreen (portal) mushaf cover transliteration size
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4194";
const SETTINGS_KEY = "mushaf-plus-settings";
const OUT = ".scratch-diag/resp";
const browser = await chromium.launch();

for (const w of [390, 1280]) {
  const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: w, height: w < 500 ? 780 : 900 } });
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
          lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
          ...a.ovr,
        }),
      );
    },
    { key: SETTINGS_KEY, ovr: { lang: "fr", theme: "light" } },
  );
  const page = await ctx.newPage();
  await page.goto(BASE + "/surah/1", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector(".hp-card, .app-view-reading", { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(1400);
  const cont = page.locator("button", { hasText: /Continuer/ }).first();
  if (await cont.isVisible().catch(() => false)) {
    await cont.click().catch(() => {});
    await page.waitForTimeout(1800);
  }
  await page.locator(".srh-fullscreen-btn, .reader-fullscreen-trigger").first().click({ timeout: 6000 }).catch(() => {});
  await page.waitForSelector(".mfp-book", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => {
    const els = [...document.querySelectorAll(".cpv-surah-name-tr, .mp-surah-name-tr")];
    return els.map((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        txt: (el.textContent || "").trim().slice(0, 18),
        fs: cs.fontSize,
        inPortal: !!el.closest(".mfp-portal-root"),
        w: Math.round(r.width),
        sw: el.scrollWidth,
        trunc: el.scrollWidth > Math.round(r.width) + 1,
      };
    });
  });
  console.log(w, JSON.stringify(info));
  await page.screenshot({ path: `${OUT}/fs-cpv-${w}.png`, timeout: 9000 }).catch(() => {});
  await ctx.close();
}
await browser.close();
