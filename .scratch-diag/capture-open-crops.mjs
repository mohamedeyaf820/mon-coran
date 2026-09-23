import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/open-crop";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const p = await ctx.newPage();
await p.addInitScript(() =>
  localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({ theme: "light", riwaya: "hafs", showTajwid: true, displayMode: "page", mushafLayout: "mushaf", currentPage: 1 }),
  ));
await p.goto(`${BASE}/page/1`, { waitUntil: "domcontentloaded" });
const skip = p.locator(".splash-screen button", { hasText: /Passer|Skip/ });
if (await skip.count()) await skip.first().click().catch(() => {});
await p.waitForFunction(() => document.querySelector('.page-stream__page[data-stream-page="1"] .qcm-line:not(.qcm-line--empty)'), { timeout: 40000 }).catch(() => {});
await p.waitForTimeout(1200);
await p.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn").first().click();
await p.waitForSelector(".mfp-portal-root .qcm-opening-frame", { timeout: 20000 });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(2000);
const sheet = p.locator(".mfp-portal-root .qcm-page-shell").first();
await sheet.screenshot({ path: `${OUT}/full.png` });
await sheet.screenshot({ path: `${OUT}/top.png`, clip: { x: 0, y: 0, width: 400, height: 90 } });
await sheet.screenshot({ path: `${OUT}/bottom.png`, clip: { x: 0, y: 280, width: 400, height: 90 } });
await browser.close();
