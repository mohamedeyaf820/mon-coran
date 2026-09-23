import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/open-pages";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot({ riwaya, page, w = 390, h = 844, theme = "light" }) {
  const label = `${riwaya}-${page}-${w}`;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(
    ([seed]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed)),
    [{ theme, riwaya, showTajwid: true, displayMode: "page", mushafLayout: "mushaf", currentPage: page }],
  );
  await p.goto(`${BASE}/page/${page}`, { waitUntil: "domcontentloaded" });
  const skip = p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
  if (await skip.count()) {
    await skip.first().click().catch(() => {});
    await p.waitForSelector(".splash-screen", { state: "detached", timeout: 8000 }).catch(() => {});
  }
  // Let the page stream settle on the requested leaf before opening the book.
  await p.waitForFunction((n) => document.body.innerText.includes(`Page ${n}`), page, { timeout: 25000 }).catch(() => {});
  await p.waitForTimeout(2500);
  await p.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn").first().click();
  await p.waitForSelector(".mfp-portal-root .qcm-lines", { timeout: 20000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2500);
  const sheet = p.locator(".mfp-portal-root .qcm-page-shell").first();
  await sheet.screenshot({ path: `${OUT}/${label}.png` }).catch(() => {});
  const geo = await p.evaluate(() => {
    const lines = Array.from(document.querySelectorAll(".mfp-portal-root .qcm-page .qcm-line"));
    const box = document.querySelector(".mfp-portal-root .qcm-page").getBoundingClientRect();
    const linesBox = document.querySelector(".mfp-portal-root .qcm-lines").getBoundingClientRect();
    return {
      page: { w: Math.round(box.width), h: Math.round(box.height) },
      block: { x: Math.round(linesBox.x - box.x), y: Math.round(linesBox.y - box.y), w: Math.round(linesBox.width), h: Math.round(linesBox.height) },
      fs: getComputedStyle(document.querySelector(".mfp-portal-root .qcm-lines")).fontSize,
      lines: lines.map((l) => {
        const kids = Array.from(l.children);
        if (!kids.length) return { n: l.dataset.lineNumber, empty: true };
        const left = Math.min(...kids.map((k) => k.getBoundingClientRect().left));
        const right = Math.max(...kids.map((k) => k.getBoundingClientRect().right));
        return { n: l.dataset.lineNumber, kind: l.className.replace("qcm-line", "").trim(), ink: Math.round(right - left), fromRight: Math.round(box.right - right) };
      }),
    };
  });
  console.log(`\n### ${label}`, JSON.stringify(geo, null, 1));
  await ctx.close();
}

await shot({ riwaya: "hafs", page: 1 });
await shot({ riwaya: "hafs", page: 2 });
await shot({ riwaya: "warsh", page: 1 });
await shot({ riwaya: "warsh", page: 2 });
await shot({ riwaya: "warsh", page: 5 });
await shot({ riwaya: "hafs", page: 572 });
await shot({ riwaya: "hafs", page: 1, w: 1280, h: 900 });
await browser.close();
