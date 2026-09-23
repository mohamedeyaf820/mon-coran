import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "surah", mushafLayout: "list", lang: "fr", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
})));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
const s = page.locator(".splash-screen button").filter({ hasText: /Passer|Skip/ }).first();
if (await s.count()) await s.click({ force: true }).catch(() => {});
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 15000 });
await page.waitForTimeout(1200);

// 1) Progress bar reacts to .app-main scroll
await page.mouse.move(195, 500);
await page.mouse.wheel(0, 4000);
await page.waitForTimeout(600);
const bar1 = await page.evaluate(() => document.querySelector(".app-scroll-progress__bar")?.style.width);
console.log("progress after 4000px scroll:", bar1);

// 2) Toolbar touch targets
const sizes = await page.evaluate(() => Array.from(document.querySelectorAll(".reader-toolbar-btn, .reader-toolbar__font-stepper button")).map((b) => {
  const r = b.getBoundingClientRect();
  return { label: b.getAttribute("aria-label") || b.title || b.textContent?.trim().slice(0, 12), w: Math.round(r.width), h: Math.round(r.height) };
}));
console.log("toolbar buttons:", JSON.stringify(sizes));
const tooSmall = sizes.filter((x) => x.w < 43 || x.h < 43);

// 3) Scroll resets on layout toggle (menu "…" -> Liste/Mushaf)
await page.evaluate(() => { const el = document.querySelector(".app-main"); el.scrollTop = 3000; });
await page.waitForTimeout(400);
const beforeToggle = await page.evaluate(() => document.querySelector(".app-main").scrollTop);
const menuBtn = page.locator('button[aria-label*="Plus"], .mp-header-more').last();
if (await menuBtn.count()) {
  await menuBtn.click();
  await page.waitForTimeout(400);
  const mushafBtn = page.locator(".mp-header-menu button").filter({ hasText: /Mushaf/ }).first();
  if (await mushafBtn.count()) { await mushafBtn.click(); }
  else { await page.keyboard.press("Escape"); }
} else {
  console.log("no header menu found — toggle via typographie panel instead");
}
await page.waitForTimeout(1200);
const afterToggle = await page.evaluate(() => document.querySelector(".app-main").scrollTop);
console.log(`scrollTop ${beforeToggle} -> layout toggle -> ${afterToggle}`);

await page.screenshot({ path: ".scratch-diag/lotC-toolbar.png", clip: { x: 0, y: 0, width: 390, height: 400 } });
await browser.close();
console.log("SMALL TARGETS:", tooSmall.length, "| progress moved:", bar1 && bar1 !== "0%");
