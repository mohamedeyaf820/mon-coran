import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures";
fs.mkdirSync(OUT, { recursive: true });

const SETTINGS = (page, surah, juz) => JSON.stringify({
  skipSplashAnimation: true,
  showHome: false,
  showDuas: false,
  sidebarOpen: false,
  displayMode: "page",
  mushafLayout: "mushaf",
  lang: "fr",
  riwaya: "warsh",
  showTajwid: false,
  currentPage: page,
  currentSurah: surah,
  currentJuz: juz,
  lastPosition: { surah, ayah: 1, page, juz },
});

async function capture(viewport, pageNumbers, tag) {
  const browser = await chromium.launch();
  for (const [pageNum, surah, juz] of pageNumbers) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));
    await page.addInitScript((s) => {
      localStorage.setItem("mushaf-plus-settings", s);
    }, SETTINGS(pageNum, surah, juz));
    await page.goto(`${BASE}/page/${pageNum}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".quran-display--platform", { timeout: 45_000 });
    const trigger = page.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first();
    await trigger.click();
    await page.waitForSelector(".mfp-portal-root", { timeout: 30_000 });
    // Let the fit loop converge (<=10 passes x ~60ms) plus font load.
    await page.waitForTimeout(5000);
    const report = await page.evaluate(() => {
      const pages = [...document.querySelectorAll(".mfp-portal-root .qcm-page")];
      return pages.map((pageEl) => {
        const lines = pageEl.querySelector('.qcm-lines[data-warsh="true"]');
        if (!lines) return { num: pageEl.dataset.page, error: "no warsh lines" };
        const openingRows = lines.querySelectorAll(".qcm-line").length;
        let flowRows = 0;
        lines.querySelectorAll(".qcm-flow").forEach((flow) => {
          const pitch = Number.parseFloat(getComputedStyle(flow).lineHeight) || 1;
          flowRows += Math.max(1, Math.round(flow.offsetHeight / pitch));
        });
        const pageBox = pageEl.getBoundingClientRect();
        const clipped = [...lines.querySelectorAll(".qcm-word, .qcm-ayah-marker")].filter((w) => {
          const b = w.getBoundingClientRect();
          return b.left < pageBox.left - 2 || b.right > pageBox.right + 2;
        }).length;
        const linesBox = lines.getBoundingClientRect();
        return {
          num: pageEl.dataset.page,
          openingRows,
          flowRows,
          totalRows: openingRows + flowRows,
          fit: getComputedStyle(lines).getPropertyValue("--qcm-flow-fit").trim(),
          markers: lines.querySelectorAll(".qcm-ayah-marker").length,
          words: lines.querySelectorAll(".qcm-word").length,
          clipped,
          linesOverflowPx: Math.max(0, Math.round(linesBox.bottom - pageBox.bottom)),
          degraded: !!pageEl.querySelector(".qcm-font-warning"),
        };
      });
    });
    console.log(`[${tag} p${pageNum}]`, JSON.stringify(report));
    await page.screenshot({ path: `${OUT}/flow-${tag}-p${pageNum}.png` });
    await context.close();
  }
  await browser.close();
}

await capture({ width: 390, height: 844 }, [[3, 2, 1], [50, 3, 3], [604, 114, 30]], "single");
await capture({ width: 1280, height: 800 }, [[3, 2, 1], [50, 3, 3]], "double");
console.log("done");
