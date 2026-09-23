import { chromium, webkit } from "playwright";
import fs from "node:fs";
const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/warsh-mobile";
fs.mkdirSync(OUT, { recursive: true });

async function run(engine, browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 140)); });
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message.slice(0, 140)));
  await page.goto(`${BASE}/surah/113`, { waitUntil: "domcontentloaded" });
  if (await page.locator(".splash-screen").count()) {
    await page.locator(".splash-screen button", { hasText: /Passer|Skip/ }).first().click().catch(() => {});
    await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
  }
  await page.waitForTimeout(1800);
  // switch to Warsh via the quick menu
  await page.locator('button[aria-label*="Plus"], button[aria-label*="menu"], button[aria-label*="More"], .mp-header-more').last().click().catch((e) => console.log(engine, "dots fail"));
  await page.waitForTimeout(500);
  await page.locator(".mp-header-menu button").filter({ hasText: /^Warsh$/ }).first().click().catch((e) => console.log(engine, "warsh fail"));
  await page.waitForTimeout(3000);
  await page.mouse.click(195, 820).catch(() => {});
  await page.waitForTimeout(800);
  const listInfo = await page.evaluate(() => {
    const el = document.querySelector(".qc-ayah-text-ar");
    return {
      warshFontLoaded: document.fonts.check('24px "QPC Warsh"'),
      fam: el ? getComputedStyle(el).fontFamily.slice(0, 50) : null,
      sample: el ? el.textContent.slice(0, 40) : null,
      lh: el ? getComputedStyle(el).lineHeight : null,
    };
  });
  await page.screenshot({ path: `${OUT}/${engine}-list-113.png` });
  // Mushaf page mode
  await page.locator('button[aria-label*="Plus"], button[aria-label*="menu"], button[aria-label*="More"], .mp-header-more').last().click().catch(() => {});
  await page.waitForTimeout(400);
  await page.locator(".mp-header-menu button").filter({ hasText: /^Mushaf$/ }).first().click().catch(() => {});
  await page.waitForTimeout(2500);
  await page.mouse.click(195, 820).catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${engine}-mushaf-113.png` });
  // Fullscreen overlay (Warsh)
  await page.locator('button[aria-label*="lein"], .reader-fullscreen-trigger, .srh-fullscreen-btn').first().click().catch((e) => console.log(engine, "fs fail"));
  await page.waitForSelector(".mfp-portal-root", { timeout: 8000 }).catch(() => console.log(engine, "no portal"));
  await page.waitForTimeout(2500);
  const fsInfo = await page.evaluate(() => {
    const lines = document.querySelector('.qcm-lines[data-warsh="true"]');
    const flow = document.querySelector(".qcm-flow");
    return {
      hasWarshFlow: !!flow,
      fit: flow ? getComputedStyle(document.querySelector(".qcm-lines")).getPropertyValue("--qcm-flow-fit") : null,
      words: document.querySelectorAll(".qcm-word--warsh").length,
      font: flow ? getComputedStyle(flow).fontFamily.slice(0, 40) : null,
      overflowX: (() => { const vp = document.querySelector(".mfp-viewport"); return vp ? vp.scrollWidth - vp.clientWidth : null; })(),
    };
  });
  await page.screenshot({ path: `${OUT}/${engine}-fullscreen-113.png` });
  console.log(engine, JSON.stringify({ listInfo, fsInfo, errors: errors.slice(0, 6) }));
  await ctx.close();
}

await run("webkit", await webkit.launch());
await run("android-chromium", await chromium.launch());
process.exit(0);
