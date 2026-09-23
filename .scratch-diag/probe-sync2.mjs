import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "fr", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
})));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 20000 });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  Array.from(document.querySelectorAll(".qc-reader-toolbar__modes button")).find(b => /Mushaf/.test(b.textContent))?.click();
});
await page.waitForTimeout(2000);
const burger = await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll("button")).find((x) => {
    const l = (x.getAttribute("aria-label") || "").toLowerCase();
    return l.includes("menu") || l.includes("导航") || l === "☰";
  });
  if (b) { b.click(); return b.getAttribute("aria-label"); }
  return null;
});
await page.waitForTimeout(900);
const pressed = await page.evaluate(() => Array.from(document.querySelectorAll("button"))
  .filter((x) => /mushaf|liste/i.test(x.textContent))
  .map((x) => ({ t: x.textContent.trim().slice(0, 24), p: x.getAttribute("aria-pressed"), active: x.className.includes("is-active") })));
console.log("burger:", burger, JSON.stringify(pressed));
await browser.close();
