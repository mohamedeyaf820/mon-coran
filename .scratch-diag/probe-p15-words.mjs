import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "mushaf", lang: "fr", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false, warshStrictMode: true,
})));
// instrument: capture React props? simpler: read DOM word text at 2s
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qcm-page-shell", { timeout: 25000 });
for (const t of [2000, 3000, 5000]) {
  await page.waitForTimeout(t === 2000 ? 2000 : 1000);
  const d = await page.evaluate(() => {
    const sec = document.querySelector("[data-stream-page='3']");
    const words = Array.from(sec.querySelectorAll(".qcm-word"));
    return {
      n: words.length,
      empty: words.filter((w) => !w.textContent.trim()).length,
      firstTexts: words.slice(0, 3).map((w) => JSON.stringify(w.textContent)),
    };
  });
  console.log(t + "ms page3:", JSON.stringify(d));
}
await page.mouse.wheel(0, 2500); await page.waitForTimeout(3000);
const p5 = await page.evaluate(() => {
  const sec = document.querySelector("[data-stream-page='5']");
  const words = sec ? Array.from(sec.querySelectorAll(".qcm-word")) : [];
  return { n: words.length, empty: words.filter((w) => !w.textContent.trim()).length, first: words.slice(0,2).map(w=>JSON.stringify(w.textContent)) };
});
console.log("page5:", JSON.stringify(p5));
await browser.close();
