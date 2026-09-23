import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/inapp-sheet";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot(label, { page = "572", w = 390, h = 844, theme = "light", riwaya = "hafs" }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3 });
  const p = await ctx.newPage();
  await p.addInitScript(
    ([seed]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed)),
    [{ theme, riwaya, showTajwid: true, displayMode: "page", mushafLayout: "mushaf", currentPage: Number(page) }],
  );
  await p.goto(`${BASE}/page/${page}`, { waitUntil: "domcontentloaded" });
  const skip = p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
  if (await skip.count()) {
    await skip.first().click().catch(() => {});
    await p.waitForSelector(".splash-screen", { state: "detached", timeout: 8000 }).catch(() => {});
  }
  await p.waitForSelector(".quran-mode-pane--mushaf .qcm-lines", { timeout: 25000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1500);
  const late = p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
  if (await late.count()) {
    await late.first().click().catch(() => {});
  }
  await p.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(800);
  const sheet = p.locator(".quran-mode-pane--mushaf .qcm-page").first();
  await sheet.scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await sheet.screenshot({ path: `${OUT}/${label}--sheet.png` }).catch(() => {});
  await p.screenshot({ path: `${OUT}/${label}.png` });
  const metrics = await p.evaluate(() => {
    const r = (s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { w: Math.round(b.width), h: Math.round(b.height), fs: getComputedStyle(el).fontSize };
    };
    return { band: r(".quran-mode-pane--mushaf .qcm-surah-title"), name: r(".quran-mode-pane--mushaf .qcm-surah-title__name"), folio: r(".qcm-page-folio"), line: r(".quran-mode-pane--mushaf .qcm-line") };
  });
  console.log(label, JSON.stringify(metrics));
  await ctx.close();
}

await shot("inapp-phone", {});
await shot("inapp-tablet", { w: 820, h: 1180 });
await shot("inapp-warsh", { riwaya: "warsh" });
await browser.close();
console.log("done");
