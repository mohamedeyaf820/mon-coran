import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
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
console.log(JSON.stringify(await p.evaluate(() => {
  const page = document.querySelector(".mfp-portal-root .qcm-page");
  const head = page.querySelector(".qcm-page-header");
  const foot = page.querySelector(".qcm-page-footer");
  const box = (el) => { const b = el.getBoundingClientRect(); const pb = page.getBoundingClientRect(); return { top: Math.round(b.top - pb.top), bottom: Math.round(b.bottom - pb.top), h: Math.round(b.height) }; };
  const bs = (el) => { const s = getComputedStyle(el); return { bb: s.borderBottomWidth + " " + s.borderBottomColor, bt: s.borderTopWidth + " " + s.borderTopColor }; };
  return { head: { ...box(head), ...bs(head) }, foot: { ...box(foot), ...bs(foot) } };
}), null, 1));
await browser.close();
