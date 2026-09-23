import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 3 });
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

const metrics = await page.evaluate(() => {
  const shell = document.querySelector(".mfp-portal-root .qcm-page-shell");
  const flow = shell.querySelector(".qcm-flow");
  const lines = shell.querySelector(".qcm-lines");
  const cs = getComputedStyle(shell);
  const shellRect = shell.getBoundingClientRect();
  const lineRect = lines.getBoundingClientRect();
  let maxLeft = 0, maxRight = 0; const over = [];
  for (const w of shell.querySelectorAll(".qcm-word")) {
    for (const r of w.getClientRects()) {
      const dl = lineRect.left - r.left, dr = r.right - lineRect.right;
      if (dl > 0.5 || dr > 0.5) {
        over.push({ text: w.textContent.slice(0, 18), dl: +dl.toFixed(1), dr: +dr.toFixed(1) });
        maxLeft = Math.max(maxLeft, dl); maxRight = Math.max(maxRight, dr);
      }
    }
  }
  return {
    shellOverflow: `${cs.overflowX}/${cs.overflowY}`, shellMaxWidth: cs.maxWidth,
    shellRect: { l: +shellRect.left.toFixed(1), r: +shellRect.right.toFixed(1) },
    lineRect: { l: +lineRect.left.toFixed(1), r: +lineRect.right.toFixed(1) },
    flowFont: getComputedStyle(flow).fontSize, fit: getComputedStyle(lines).getPropertyValue("--qcm-flow-fit"),
    maxLeft: +maxLeft.toFixed(1), maxRight: +maxRight.toFixed(1), overflowing: over.slice(0, 12),
  };
});
console.log(JSON.stringify(metrics, null, 1));

const shots = [
  ["fix-none", ""],
  ["fix-shellvis", ".mfp-portal-root .qcm-page-shell { overflow-x: visible !important; max-width: none !important; }"],
];
for (const [name, css] of shots) {
  await page.evaluate((c) => {
    let s = document.getElementById("ab2"); if (!s) { s = document.createElement("style"); s.id = "ab2"; document.head.appendChild(s); }
    s.textContent = c;
  }, css);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `.scratch-diag/captures/edge-${name}.png` });
}
await browser.close();
