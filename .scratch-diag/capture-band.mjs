import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/band";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot(riwaya, page = "572") {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 4 });
  const p = await ctx.newPage();
  await p.addInitScript(
    ([seed]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed)),
    [{ theme: "light", riwaya, showTajwid: false, displayMode: "page", mushafLayout: "mushaf", currentPage: Number(page) }],
  );
  await p.goto(`${BASE}/page/${page}`, { waitUntil: "domcontentloaded" });
  const skip = p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
  if (await skip.count()) {
    await skip.first().click().catch(() => {});
    await p.waitForSelector(".splash-screen", { state: "detached", timeout: 8000 }).catch(() => {});
  }
  await p.waitForSelector(".mushaf-page-wrapper, .qc-ayah-text-ar, .qcm-lines", { timeout: 20000 });
  await p.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn, button[aria-label*='lein']").first().click();
  await p.waitForSelector(".mfp-portal-root .qcm-lines", { timeout: 20000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1500);
  const bandLoc = p.locator(".mfp-portal-root .qcm-line--surah-header >> visible=true").first();
  const box = await p.evaluate(() => {
    const bands = Array.from(document.querySelectorAll(".mfp-portal-root .qcm-surah-title"));
    const band = bands.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.top >= 0 && r.bottom <= innerHeight;
    });
    const name = band?.querySelector(".qcm-surah-title__name");
    if (!band || !name) return null;
    const b = band.getBoundingClientRect();
    const n = name.getBoundingClientRect();
    return { band: { y: b.y, h: b.height }, name: { y: n.y, h: n.height, w: n.width }, room: { top: n.y - b.y, bottom: b.bottom - n.bottom } };
  });
  if (await bandLoc.count()) {
    await bandLoc.screenshot({ path: `${OUT}/${riwaya}-${page}.png` }).catch(() => {});
  }
  console.log(riwaya, page, JSON.stringify(box));
  await ctx.close();
}

await shot("warsh", "572");
await shot("hafs", "572");
await shot("warsh", "1");
await shot("hafs", "1");
await browser.close();
