import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/juz-medallion";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot({ riwaya, page, label }) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(
    ([seed]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed)),
    [{ theme: "light", riwaya, showTajwid: false, displayMode: "page", mushafLayout: "mushaf", currentPage: page }],
  );
  await p.goto(`${BASE}/page/${page}`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1500);
  const skip = p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
  if (await skip.count()) await skip.first().click().catch(() => {});
  await p.waitForSelector(".splash-screen", { state: "detached", timeout: 15000 }).catch(() => {});
  await p.waitForFunction(
    (n) => {
      const el = document.querySelector(`.page-stream__page[data-stream-page="${n}"] .qcm-lines`);
      return !!el && el.textContent.trim().length > 20;
    },
    page,
    { timeout: 30000 },
  ).catch(() => {});
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2500);

  const info = await p.evaluate((n) => {
    const host = document.querySelector(`.page-stream__page[data-stream-page="${n}"] .qcm-page`);
    const juz = host?.querySelector(".qcm-ayah-marker--juz");
    const b = juz?.getBoundingClientRect();
    return {
      markers: host?.querySelectorAll(".qcm-ayah-marker").length ?? null,
      juzMarkers: host?.querySelectorAll(".qcm-ayah-marker--juz").length ?? null,
      abs: b ? { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) } : null,
      color: juz ? getComputedStyle(juz).color : null,
    };
  }, page);
  console.log(`### ${label}`, JSON.stringify(info));
  if (info.abs) {
    const zoom = await ctx.newCDPSession(p);
    await zoom.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 8, mobile: true });
    await p.screenshot({ path: `${OUT}/${label}-crop.png`, clip: { x: info.abs.x - 26, y: info.abs.y - 26, width: 70, height: 70 } });
  }
  await ctx.close();
}

await shot({ riwaya: "hafs", page: 22, label: "inapp-hafs-22" });
await shot({ riwaya: "warsh", page: 22, label: "inapp-warsh-22" });
await browser.close();
