/**
 * One-off capture of the reader header bar at tiny widths. Not part of the suite.
 * Usage: node .scratch-diag/resp-barshot.mjs
 */
import { chromium } from "@playwright/test";
const KEY = "mushaf-plus-settings";
function seed(a) {
  localStorage.setItem(
    a.key,
    JSON.stringify({
      skipSplashAnimation: true,
      showHome: false,
      showDuas: false,
      sidebarOpen: false,
      lang: "fr",
      theme: "light",
      riwaya: "hafs",
      displayMode: "surah",
      mushafLayout: "list",
      quranFontSize: 34,
      fontFamily: "qpc-hafs",
      lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
    }),
  );
}
const b = await chromium.launch();
for (const w of [280, 320]) {
  const ctx = await b.newContext({
    serviceWorkers: "block",
    viewport: { width: w, height: 800 },
    deviceScaleFactor: 3,
  });
  await ctx.addInitScript(seed, { key: KEY });
  const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:4187/surah/2", { waitUntil: "domcontentloaded" });
  await p.waitForSelector(".qc-ayah-text-ar", { timeout: 40000 });
  await p
    .waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 })
    .catch(() => {});
  await p.waitForTimeout(1200);
  await p.locator(".mp-header__bar").screenshot({ path: `.scratch-diag/resp/shots/bar-${w}.png` });
  await ctx.close();
}
await b.close();
