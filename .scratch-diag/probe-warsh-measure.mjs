import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/open-leaf";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot({ riwaya, page, w = 390, h = 844, label }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(
    ([seed]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed)),
    [{ theme: "light", riwaya, showTajwid: true, displayMode: "page", mushafLayout: "mushaf", currentPage: page }],
  );
  await p.goto(`${BASE}/page/${page}`, { waitUntil: "domcontentloaded" });
  const skip = p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
  if (await skip.count()) {
    await skip.first().click().catch(() => {});
    await p.waitForSelector(".splash-screen", { state: "detached", timeout: 8000 }).catch(() => {});
  }
  await p.waitForFunction((n) => document.body.innerText.includes(`Page ${n}`), page, { timeout: 25000 }).catch(() => {});
  await p.waitForTimeout(2500);
  await p.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn").first().click();
  await p.waitForFunction(() => {
    const el = document.querySelector(".mfp-portal-root .qcm-lines");
    return !!el && el.textContent.trim().length > 20;
  }, { timeout: 30000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(3500);

  const geo = await p.evaluate(() => {
    const root = document.querySelector(".mfp-portal-root");
    const leaf = root.querySelector(".qcm-page");
    const lines = root.querySelector(".qcm-lines");
    const panel = root.querySelector(".qcm-opening-frame__panel");
    const lb = leaf.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(lines);
    const rects = Array.from(range.getClientRects()).filter((b) => b.width > 1);
    const inkL = rects.length ? Math.min(...rects.map((b) => b.left)) - lb.left : null;
    const inkR = rects.length ? lb.right - Math.max(...rects.map((b) => b.right)) : null;
    const pb = panel?.getBoundingClientRect();
    return {
      warsh: lines.getAttribute("data-warsh") === "true",
      leaf: { w: Math.round(lb.width), h: Math.round(lb.height) },
      panel: pb ? { l: Math.round(pb.left - lb.left), r: Math.round(lb.right - pb.right), t: Math.round(pb.top - lb.top) } : null,
      ink: inkL === null ? null : { l: Math.round(inkL), r: Math.round(inkR) },
      gap: pb && inkL !== null ? { l: Math.round(inkL - (pb.left - lb.left)), r: Math.round(lb.right - Math.max(...rects.map((b) => b.right)) - (lb.right - pb.right)) } : null,
    };
  });
  console.log(`### ${label} ${JSON.stringify(geo)}`);
  await p.locator(".mfp-portal-root .qcm-page").first().screenshot({ path: `${OUT}/${label}.png` });
  await ctx.close();
}

await shot({ riwaya: "hafs", page: 1, label: "hafs-1" });
await shot({ riwaya: "hafs", page: 2, label: "hafs-2" });
await shot({ riwaya: "warsh", page: 1, label: "warsh-1" });
await shot({ riwaya: "warsh", page: 2, label: "warsh-2" });
await shot({ riwaya: "warsh", page: 5, label: "warsh-5" });
await shot({ riwaya: "hafs", page: 572, label: "hafs-572" });
await shot({ riwaya: "hafs", page: 1, w: 1280, h: 900, label: "hafs-1-1280" });
await browser.close();
