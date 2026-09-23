import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) console.log(`[console.${m.type()}]`, m.text().slice(0, 300));
});
page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));
await page.addInitScript(() => {
  localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({
      skipSplashAnimation: true,
      showHome: false,
      showDuas: false,
      sidebarOpen: false,
      displayMode: "page",
      mushafLayout: "mushaf",
      lang: "fr",
      riwaya: "hafs",
      showTajwid: true,
      currentPage: 3,
      currentSurah: 2,
      currentJuz: 1,
      lastPosition: { surah: 2, ayah: 1, page: 3, juz: 1 },
    }),
  );
});
await page.goto(`${BASE}/page/3`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".quran-display--platform", { timeout: 45_000 });
await page.screenshot({ path: `${OUT}/diag-step1-reader.png` });
const trigger = page.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first();
console.log("trigger count:", await page.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").count());
await trigger.click();
await page.waitForSelector(".mfp-portal-root", { timeout: 30_000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${OUT}/diag-step2-overlay.png` });
console.log("qcm-word count:", await page.locator(".mfp-portal-root .qcm-word").count());
console.log("shell count:", await page.locator(".mfp-portal-root .qcm-page").count());
console.log("font-warning:", await page.locator(".mfp-portal-root .qcm-font-warning").count());
console.log("fallback:", await page.locator(".mfp-portal-root .qcm-fallback, [data-font-failed]").count());
await context.close();
await browser.close();
