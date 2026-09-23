import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "ar", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
})));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 15000 });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const pill = Array.from(document.querySelectorAll(".qc-reader-toolbar__modes button")).find((b) => /مصحف/.test(b.textContent || ""));
  pill?.click();
});
await page.waitForTimeout(4000);
const dump = await page.evaluate(() => ({
  streamPages: Array.from(document.querySelectorAll("[data-stream-page]")).map(s => s.getAttribute("data-stream-page")),
  shells: document.querySelectorAll(".qcm-page-shell").length,
  mushafPage: document.querySelectorAll(".quran-mushaf-page, [class*='mushaf-page']").length,
  bodyClasses: document.body.className,
  cardText: document.querySelector(".reader-context-card")?.textContent?.replace(/\s+/g," ").trim(),
  pressed: Array.from(document.querySelectorAll(".qc-reader-toolbar__modes button")).map(b => b.getAttribute("aria-pressed") + ":" + b.textContent.trim()),
  firstPageHtml: document.querySelector("[data-stream-page]")?.className,
}));
console.log(JSON.stringify(dump, null, 1));
await browser.close();
