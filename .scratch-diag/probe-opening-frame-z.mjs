import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/zdiag";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.addInitScript(
  () =>
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        theme: "light",
        riwaya: "hafs",
        showTajwid: true,
        displayMode: "page",
        mushafLayout: "mushaf",
        currentPage: 1,
      }),
    ),
);
await p.goto(`${BASE}/page/1`, { waitUntil: "domcontentloaded" });
const skip = p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
if (await skip.count()) {
  await skip.first().click().catch(() => {});
  await p.waitForSelector(".splash-screen", { state: "detached", timeout: 8000 }).catch(() => {});
}
await p.waitForFunction(() => {
  const l = document.querySelector('.page-stream__page[data-stream-page="1"] .qcm-line:not(.qcm-line--empty)');
  return Boolean(l && l.children.length);
}, { timeout: 40000 }).catch(() => console.log("stream data never arrived"));
await p.waitForTimeout(1500);
await p.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn").first().click();
await p.waitForSelector(".mfp-portal-root .qcm-opening-frame", { timeout: 20000 });
await p.evaluate(() => document.fonts.ready);
await p.waitForFunction(() => {
  const l = document.querySelector(".mfp-portal-root .qcm-line:not(.qcm-line--empty)");
  return Boolean(l && l.children.length);
}, { timeout: 30000 }).catch(() => console.log("portal data never arrived"));
await p.waitForTimeout(2500);

const diag = await p.evaluate(() => {
  const page = document.querySelector(".mfp-portal-root .qcm-page");
  const frame = page.querySelector(".qcm-opening-frame");
  const panel = page.querySelector(".qcm-opening-frame__panel");
  const cs = (el) => {
    const s = getComputedStyle(el);
    return { pos: s.position, z: s.zIndex, iso: s.isolation, bg: s.backgroundColor, border: s.borderTopWidth + " " + s.borderTopColor, opacity: s.opacity, display: s.display };
  };
  const r = panel.getBoundingClientRect();
  const pr = page.getBoundingClientRect();
  return {
    page: cs(page),
    frame: cs(frame),
    panel: cs(panel),
    panelRect: { x: Math.round(r.x - pr.x), y: Math.round(r.y - pr.y), w: Math.round(r.width), h: Math.round(r.height) },
    pageRect: { w: Math.round(pr.width), h: Math.round(pr.height) },
    stackAncestors: (() => {
      const out = [];
      let el = page.parentElement;
      while (el && out.length < 8) {
        const s = getComputedStyle(el);
        const sc = s.position !== "static" && s.zIndex !== "auto"
          || s.isolation === "isolate" || s.opacity !== "1" || s.transform !== "none" || s.filter !== "none";
        out.push(`${el.className || el.tagName}{pos:${s.position},z:${s.zIndex},iso:${s.isolation},op:${s.opacity},bg:${s.backgroundColor.slice(0, 22)}}${sc ? " <<SC" : ""}`);
        el = el.parentElement;
      }
      return out;
    })(),
  };
});
console.log(JSON.stringify(diag, null, 1));

await p.locator(".mfp-portal-root .qcm-page-shell").first().screenshot({ path: `${OUT}/before.png` });
await p.addStyleTag({ content: ".mfp-portal-root .qcm-page { isolation: isolate; }" });
await p.waitForTimeout(400);
await p.locator(".mfp-portal-root .qcm-page-shell").first().screenshot({ path: `${OUT}/after-isolate.png` });
await browser.close();
