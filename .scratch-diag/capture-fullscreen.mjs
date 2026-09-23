import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/fullscreen";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot(label, viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/page/1`, { waitUntil: "domcontentloaded" });
  if (await page.locator(".splash-screen").count()) {
    const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
    await skip.first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    await skip.first().click().catch(() => {});
    await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
  }
  await page.waitForSelector(".mushaf-page-wrapper, .cpv-flow, .qc-ayah-text-ar", { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  const fs2 = page.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn, button[aria-label*='lein']").first();
  await fs2.click();
  await page.waitForSelector(".mfp-portal-root", { timeout: 10000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/${label}-p1.png` });
  // page 4 (Al-Baqara, dense): side arrow on wide layouts, pagination on phones
  const next = page.locator(".mfp-side-nav--next").first();
  if (await next.isVisible().catch(() => false)) {
    await next.click();
  } else {
    await page.locator(".mfp-mobile-pagination button").last().click().catch(() => {});
  }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${label}-p2.png` });
  const metrics = await page.evaluate(() => {
    const root = document.querySelector(".mfp-portal-root");
    const vp = document.querySelector(".mfp-viewport");
    const sheet = document.querySelector(".mfp-book");
    const lines = document.querySelector(".qcm-lines");
    const r = sheet?.getBoundingClientRect();
    return {
      layout: root?.dataset.layout,
      sheetW: r?.width, sheetH: r?.height,
      vw: innerWidth, vh: innerHeight,
      overflowX: vp ? vp.scrollWidth - vp.clientWidth : null,
      overflowY: vp ? vp.scrollHeight - vp.clientHeight : null,
      font: lines ? getComputedStyle(lines).fontSize : null,
      footerText: document.querySelector(".qcm-page-footer")?.textContent,
    };
  });
  console.log(label, JSON.stringify(metrics));
  await ctx.close();
}

await shot("phone-390", { width: 390, height: 844 });
await shot("tablet-820", { width: 820, height: 1180 });
await shot("tablet-land-1024", { width: 1024, height: 768 });
await shot("desktop-1440", { width: 1440, height: 900 });
await browser.close();
console.log("done");
