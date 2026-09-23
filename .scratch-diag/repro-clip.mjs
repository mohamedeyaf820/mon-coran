import { chromium } from "playwright";
import fs from "node:fs";
const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/clip-review";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.goto(`${BASE}/surah/113`, { waitUntil: "domcontentloaded" });
if (await page.locator(".splash-screen").count()) {
  await page.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ }).first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
}
await page.waitForSelector(".qc-ayah-text-ar, .quran-arabic-text", { timeout: 20000 });
await page.locator('button[aria-label*="Tajweed"], button[aria-label*="Tajwid"]').first().click().catch(() => {});
await page.waitForTimeout(600);
console.log("view pills:", await page.locator(".srh-view-pills button").allTextContents());

async function setFont(id, size) {
  const ok = await page.evaluate(([id, size]) => {
    const sel = document.querySelector(".srh-typography-panel select, .afc-select");
    const range = document.querySelector(".srh-typography-panel input[type=range], .afc-range");
    if (!sel || !range) return "missing controls";
    const opts = Array.from(sel.options).map((o) => o.value);
    const setSel = window.HTMLSelectElement.prototype.__lookupSetter__("value") || Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    setSel.call(sel, id);
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    const setVal = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setVal.call(range, String(size));
    range.dispatchEvent(new Event("input", { bubbles: true }));
    return opts.join(",");
  }, [id, size]);
  console.log("font select options ->", ok.slice(0, 120));
  await page.waitForTimeout(1400);
}

const detect = () => page.evaluate(() => {
  const out = [];
  document.querySelectorAll(".qc-ayah-text-ar, .quran-arabic-text").forEach((el) => {
    let lo = Infinity, hi = -Infinity;
    el.querySelectorAll("span").forEach((s) => {
      for (const r of s.getClientRects()) { lo = Math.min(lo, r.top); hi = Math.max(hi, r.bottom); }
    });
    const er = el.getBoundingClientRect();
    lo = Math.min(lo, er.top); hi = Math.max(hi, er.bottom);
    let anc = el.parentElement, clipper = null;
    while (anc) {
      const cs = getComputedStyle(anc);
      if (cs.overflowY !== "visible") { clipper = { node: anc, cs }; break; }
      anc = anc.parentElement;
    }
    let clipped = null;
    if (clipper) {
      const cr = clipper.node.getBoundingClientRect();
      const cs2 = getComputedStyle(clipper.node);
      const innerTop = cr.top + parseFloat(cs2.paddingTop), innerBot = cr.bottom - parseFloat(cs2.paddingBottom);
      if (lo < innerTop - 0.5 || hi > innerBot + 0.5)
        clipped = { cls: String(clipper.node.className).slice(0, 60), topLoss: +(innerTop - lo).toFixed(1), botLoss: +(hi - innerBot).toFixed(1) };
    }
    if (clipped) out.push({ t: el.textContent.slice(0, 20), fs: getComputedStyle(el).fontSize, lh: getComputedStyle(el).lineHeight, clipped });
  });
  return { n: document.querySelectorAll(".qc-ayah-text-ar, .quran-arabic-text").length, clips: out.slice(0, 4) };
});

for (const [id, size] of [["qpc-hafs", 30], ["amiri-quran", 30], ["noto-naskh-arabic", 30]]) {
  await setFont(id, size);
  console.log(id, size, JSON.stringify(await detect()));
  await page.locator(".qc-ayah-text-ar").first().screenshot({ path: `${OUT}/${id}-${size}.png` }).catch((e) => console.log("shot fail"));
}
await page.screenshot({ path: `${OUT}/full.png` });
await browser.close();
