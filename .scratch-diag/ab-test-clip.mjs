import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 632, height: 840 }, deviceScaleFactor: 4 });
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
const clip = { x: 420, y: 130, width: 210, height: 80 };
await page.screenshot({ path: ".scratch-diag/captures/ab-before.png", clip });
const tests = {
  lh: ".mfp-portal-root .qcm-word { line-height: normal !important; }",
  bidi: ".mfp-portal-root .qcm-word { unicode-bidi: plaintext !important; }",
  feat: ".mfp-portal-root .qcm-word { text-rendering: auto !important; -webkit-font-feature-settings: normal !important; font-feature-settings: normal !important; }",
  smooth: ".mfp-portal-root .qcm-word { -webkit-font-smoothing: auto !important; }",
  all: ".mfp-portal-root .qcm-word { line-height: normal !important; unicode-bidi: plaintext !important; text-rendering: auto !important; font-feature-settings: normal !important; -webkit-font-feature-settings: normal !important; }",
};
for (const [name, css] of Object.entries(tests)) {
  await page.evaluate((c) => {
    let s = document.getElementById("ab-test");
    if (!s) { s = document.createElement("style"); s.id = "ab-test"; document.head.appendChild(s); }
    s.textContent = c;
  }, css);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `.scratch-diag/captures/ab-${name}.png`, clip });
}
await browser.close();
