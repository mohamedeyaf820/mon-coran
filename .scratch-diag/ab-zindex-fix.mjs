import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 6 });
const page = await context.newPage();
await page.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: "warsh",
    fontFamily: "qpc-warsh", fontFamilyByRiwaya: { hafs: "qpc-hafs", warsh: "qpc-warsh" },
    currentSurah: 2, currentPage: 3, currentJuz: 1,
    lastPosition: { surah: 2, ayah: 1, page: 3, juz: 1 },
  }));
});
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".quran-display--platform", { timeout: 45_000 });
await page.waitForTimeout(3000);
await page.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first().click();
await page.waitForSelector(".mfp-portal-root .qcm-flow .qcm-word", { timeout: 30_000 });
await page.waitForTimeout(4000);

const regions = {
  r1: { x: 330, y: 130, width: 63, height: 70 },
  r2: { x: 0, y: 195, width: 70, height: 55 },
};
const states = {
  zfix: "#root ~ .mfp-portal-root .mfp-book .qcm-page::before { z-index: -1; }",
};
for (const [name, css] of Object.entries(states)) {
  await page.evaluate((c) => {
    let s = document.getElementById("ab5"); if (!s) { s = document.createElement("style"); s.id = "ab5"; document.head.appendChild(s); }
    s.textContent = c;
  }, css);
  await page.waitForTimeout(600);
  for (const [rn, r] of Object.entries(regions)) {
    await page.screenshot({ path: `.scratch-diag/captures/z-${rn}-${name}.png`, clip: r });
  }
}
await browser.close();
