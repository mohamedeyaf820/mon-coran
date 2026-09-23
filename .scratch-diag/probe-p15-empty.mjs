import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false, warshStrictMode: true,
})));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qcm-page-shell", { timeout: 25000 });
await page.waitForTimeout(6000);
const dump = await page.evaluate(() => {
  return Array.from(document.querySelectorAll("[data-stream-page]")).map((sec) => {
    const shell = sec.querySelector(".qcm-page-shell");
    const lines = shell ? sec.querySelectorAll(".qcm-line") : [];
    const l0 = lines[0];
    const w0 = l0?.querySelector(".qcm-word");
    return {
      page: sec.getAttribute("data-stream-page"),
      shell: !!shell,
      lines: lines.length,
      line0H: l0 ? Math.round(l0.getBoundingClientRect().height) : null,
      line0Display: l0 ? getComputedStyle(l0).display : null,
      words: sec.querySelectorAll(".qcm-word").length,
      word0Text: w0 ? JSON.stringify(w0.textContent) : null,
      word0Font: w0 ? getComputedStyle(w0).fontFamily.slice(0, 30) : null,
      fontWarn: !!sec.querySelector(".qcm-font-warning"),
    };
  });
});
console.log(JSON.stringify(dump, null, 1));
await browser.close();
