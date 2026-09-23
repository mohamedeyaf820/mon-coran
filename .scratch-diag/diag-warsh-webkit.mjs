import { chromium, webkit } from "playwright";
import fs from "node:fs";
const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/warsh-diag";
fs.mkdirSync(OUT, { recursive: true });

async function run(engine, browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/surah/113`, { waitUntil: "domcontentloaded" });
  if (await page.locator(".splash-screen").count()) {
    await page.locator(".splash-screen button", { hasText: /Passer|Skip/ }).first().click().catch(() => {});
    await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
  }
  await page.waitForTimeout(1500);
  // ensure Liste view (default may be mushaf)
  await page.locator('button[aria-label*="Plus"], .mp-header-more').last().click().catch(() => {});
  await page.waitForTimeout(400);
  await page.locator(".mp-header-menu button").filter({ hasText: /^Liste$/ }).first().click().catch(() => {});
  await page.mouse.click(195, 820).catch(() => {});
  await page.waitForTimeout(600);
  // switch to Warsh
  await page.locator('button[aria-label*="Plus"], .mp-header-more').last().click().catch(() => {});
  await page.waitForTimeout(400);
  await page.locator(".mp-header-menu button").filter({ hasText: /^Warsh$/ }).first().click().catch(() => {});
  await page.waitForTimeout(3000);
  await page.mouse.click(195, 820).catch(() => {});
  await page.waitForTimeout(800);

  const diag = await page.evaluate(() => {
    const el = document.querySelector(".qc-ayah-text-ar");
    const render = el?.querySelector("[data-tajwid-render]");
    const words = el ? [...el.querySelectorAll("span")].filter((s) => s.className.includes("quran-word-item") || s.className.includes("tajwid-rule-segment")) : [];
    return {
      supportsHighlightAPI: typeof CSS !== "undefined" && !!CSS.highlights && typeof Highlight === "function",
      tajwidRender: render?.getAttribute("data-tajwid-render") ?? (el ? "none-in-ayah" : "no-ayah"),
      ayahHTML: el ? el.innerHTML.slice(0, 1200) : null,
      wordCount: words.length,
      wordClasses: words.slice(0, 8).map((w) => w.className + "|" + w.textContent.slice(0, 12)),
      style: el ? {
        textAlign: getComputedStyle(el).textAlign,
        wordSpacing: getComputedStyle(el).wordSpacing,
        letterSpacing: getComputedStyle(el).letterSpacing,
        unicodeBidi: getComputedStyle(el).unicodeBidi,
        direction: getComputedStyle(el).direction,
        fontFamily: getComputedStyle(el).fontFamily.slice(0, 60),
        fontKerning: getComputedStyle(el).fontKerning,
        fontFeatureSettings: getComputedStyle(el).fontFeatureSettings,
      } : null,
      highlightRules: CSS.highlights ? [...CSS.highlights.keys()].filter((k) => k.startsWith("tajwid-")).length : -1,
    };
  });
  fs.writeFileSync(`${OUT}/${engine}-diag.json`, JSON.stringify(diag, null, 2));
  await page.screenshot({ path: `${OUT}/${engine}-tajwid-on.png` });

  // toggle tajweed OFF
  await page.locator('button[aria-label*="Tajweed"], button[aria-label*="tajwid" i]').first().click().catch((e) => console.log(engine, "tajweed toggle not found"));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${engine}-tajwid-off.png` });
  const off = await page.evaluate(() => {
    const el = document.querySelector(".qc-ayah-text-ar");
    return { render: el?.querySelector("[data-tajwid-render]")?.getAttribute("data-tajwid-render") ?? null, html: el ? el.innerHTML.slice(0, 400) : null };
  });
  fs.writeFileSync(`${OUT}/${engine}-off.json`, JSON.stringify(off, null, 2));
  console.log(engine, JSON.stringify({ supports: diag.supportsHighlightAPI, render: diag.tajwidRender, words: diag.wordCount, rules: diag.highlightRules, offRender: off.render }));
  await ctx.close();
}

await run("webkit", await webkit.launch());
await run("chromium", await chromium.launch());
process.exit(0);
