import { chromium } from "playwright";
const browser = await chromium.launch();
async function shot(name, width, height, riwaya, tajwid, delay) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.addInitScript(({ r, tj }) => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    splashCompleted: true, skipSplashAnimation: true, showHome: false,
    displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: r,
    fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: tj, warshStrictMode: true,
  })), { r: riwaya, tj: tajwid });
  await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".qcm-page-shell", { timeout: 25000 });
  await page.waitForTimeout(delay);
  const geo = await page.evaluate(() => {
    const sec = document.querySelector("[data-stream-page='3']");
    const page_ = sec.querySelector(".qcm-page");
    const lines = sec.querySelector(".qcm-lines");
    const lr = lines?.getBoundingClientRect();
    const pr = page_?.getBoundingClientRect();
    return {
      pageW: Math.round(pr?.width), linesW: Math.round(lr?.width),
      linesOverflow: lr && pr ? lr.width > pr.width + 2 : null,
      lineCount: sec.querySelectorAll(".qcm-line").length,
      fontSize: lines ? getComputedStyle(lines).fontSize : null,
      hasFrame: page_ ? getComputedStyle(page_).borderTopWidth : null,
      folio: !!sec.querySelector(".qcm-page-folio"),
    };
  });
  console.log(name, JSON.stringify(geo));
  await page.screenshot({ path: `.scratch-diag/p15v-${name}.png`, clip: { x: 0, y: 130, width, height: Math.min(height - 130, 800) } });
  await page.close();
}
await shot("hafs-390-early", 390, 844, "hafs", false, 1500);
await shot("hafs-390", 390, 844, "hafs", false, 6000);
await shot("hafs-1100", 1100, 800, "hafs", false, 6000);
await shot("warsh-390", 390, 844, "warsh", false, 6000);
await shot("tajwid-390", 390, 844, "hafs", true, 6000);
await browser.close();
