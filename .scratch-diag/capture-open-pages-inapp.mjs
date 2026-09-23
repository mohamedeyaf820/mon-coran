import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/open-pages-inapp";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot({ riwaya, page, w = 390, h = 844 }) {
  const label = `inapp-${riwaya}-${page}-${w}`;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(
    ([seed]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed)),
    [{ theme: "light", riwaya, showTajwid: true, displayMode: "page", mushafLayout: "mushaf", currentPage: page }],
  );
  await p.goto(`${BASE}/page/${page}`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1500);
  const skip = p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
  if (await skip.count()) {
    await skip.first().click().catch(() => {});
  }
  await p.waitForSelector(".splash-screen", { state: "detached", timeout: 15000 }).catch(() => {});
  await p.waitForFunction(
    (n) => document.querySelector(`.page-stream__page[data-stream-page="${n}"] .qcm-lines`),
    page,
    { timeout: 30000 },
  ).catch(() => {});
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2500);
  const sheet = p.locator(`.page-stream__page[data-stream-page="${page}"] .qcm-page`).first();
  await sheet.screenshot({ path: `${OUT}/${label}.png` }).catch((e) => console.log("shot fail", e.message));
  const geo = await p.evaluate((n) => {
    const host = document.querySelector(`.page-stream__page[data-stream-page="${n}"] .qcm-page`);
    if (!host) return { missing: true };
    const box = host.getBoundingClientRect();
    const linesBox = host.querySelector(".qcm-lines").getBoundingClientRect();
    return {
      page: { w: Math.round(box.width), h: Math.round(box.height) },
      block: {
        x: Math.round(linesBox.x - box.x),
        y: Math.round(linesBox.y - box.y),
        w: Math.round(linesBox.width),
        h: Math.round(linesBox.height),
      },
      hasFrame: Boolean(host.querySelector(".qcm-opening-frame")),
      panel: (() => {
        const el = host.querySelector(".qcm-opening-frame__panel");
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { x: Math.round(b.x - box.x), y: Math.round(b.y - box.y), w: Math.round(b.width), h: Math.round(b.height) };
      })(),
      lineCount: host.querySelectorAll(".qcm-line").length,
      visibleLines: [...host.querySelectorAll(".qcm-line")].filter(
        (l) => getComputedStyle(l).display !== "none",
      ).length,
    };
  }, page);
  console.log(`\n### ${label}`, JSON.stringify(geo));
  await ctx.close();
}

await shot({ riwaya: "hafs", page: 1 });
await shot({ riwaya: "hafs", page: 2 });
await shot({ riwaya: "hafs", page: 3 });
await shot({ riwaya: "warsh", page: 1 });
await shot({ riwaya: "warsh", page: 2 });
await shot({ riwaya: "warsh", page: 5 });
await browser.close();
