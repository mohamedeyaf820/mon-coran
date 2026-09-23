import { chromium } from "playwright";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
async function boot(url) {
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    splashCompleted: true, skipSplashAnimation: true, showHome: false,
    displayMode: "page", mushafLayout: "list", lang: "ar", riwaya: "hafs",
    fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
  })));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".qc-ayah-text-ar", { timeout: 20000 });
  await page.waitForTimeout(1500);
  return page;
}
const page = await boot("http://127.0.0.1:4173/page/3");
// switch to Warsh via UI (settings page) or check card badge text in ar first
const before = await page.evaluate(() => ({
  badge: document.querySelector(".reader-context-card__riwaya")?.textContent?.trim(),
  card: document.querySelector(".reader-context-card")?.textContent?.replace(/\s+/g," ").trim(),
}));
console.log("HAWS hafs ar:", JSON.stringify(before));
// open the Warsh toggle: find a control mentioning ورش
const toggle = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll("button,[role='switch'],a")).find((n) => /ورش/.test(n.textContent || ""));
  if (el) { el.click(); return el.textContent.trim(); }
  return null;
});
console.log("toggle found:", toggle);
await page.waitForTimeout(2500);
const after = await page.evaluate(() => ({
  badge: document.querySelector(".reader-context-card__riwaya")?.textContent?.trim(),
  card: document.querySelector(".reader-context-card")?.textContent?.replace(/\s+/g," ").trim(),
}));
console.log("after:", JSON.stringify(after));
await page.screenshot({ path: ".scratch-diag/p3-ar-badge.png", clip: { x: 0, y: 0, width: 390, height: 300 } });
await browser.close();
