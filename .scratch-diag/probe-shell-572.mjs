import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(`${BASE}/page/${process.argv[2] || "572"}`, { waitUntil: "domcontentloaded" });
const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
if (await skip.count()) {
  await skip.first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
}
await page.waitForSelector(".mushaf-page-wrapper, .cpv-flow, .qc-ayah-text-ar", { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);
await page.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn, button[aria-label*='lein']").first().click();
await page.waitForSelector(".mfp-portal-root .qcm-lines", { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2500);

const info = await page.evaluate(() => {
  const lines = Array.from(document.querySelectorAll(".mfp-portal-root .qcm-line"));
  const describe = (el) => {
    const cs = getComputedStyle(el);
    return {
      cls: el.className,
      text: el.textContent.slice(0, 40),
      kids: Array.from(el.children).map((c) => `${c.tagName.toLowerCase()}.${c.className}`),
      display: cs.display,
      justify: cs.justifyContent,
      gap: cs.gap,
      fs: cs.fontSize,
      lh: cs.lineHeight,
      h: Math.round(el.getBoundingClientRect().height),
      w: Math.round(el.getBoundingClientRect().width),
      pad: cs.padding,
      mb: cs.marginBottom,
    };
  };
  return {
    count: lines.length,
    first3: lines.slice(0, 3).map(describe),
    last2: lines.slice(-2).map(describe),
    shell: (() => {
      const s = document.querySelector(".mfp-portal-root .qcm-page-shell");
      const p = document.querySelector(".mfp-portal-root .qcm-page");
      const hd = document.querySelector(".mfp-portal-root .qcm-page-header");
      const ft = document.querySelector(".mfp-portal-root .qcm-page-footer");
      const fo = document.querySelector(".mfp-portal-root .qcm-page-folio");
      const d = (el) => {
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { cls: el.className, text: el.textContent.slice(0, 40), fs: cs.fontSize, color: cs.color, ff: cs.fontFamily.slice(0, 24), h: Math.round(el.getBoundingClientRect().height) };
      };
      return { shell: d(s), page: d(p), header: d(hd), footer: d(ft), folio: d(fo) };
    })(),
    book: (() => {
      const b = document.querySelector(".mfp-book");
      const cs = b ? getComputedStyle(b) : null;
      return b ? { cls: b.className, w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height), zoom: cs.zoom, gs: cs.getPropertyValue("--mfp-zoom") } : null;
    })(),
    leaf: (() => {
      const l = document.querySelector(".mfp-portal-root .qcm-leaf, .mfp-portal-root .mfp-leaf");
      return l ? { cls: l.className, w: Math.round(l.getBoundingClientRect().width) } : null;
    })(),
    viewport: (() => {
      const v = document.querySelector(".mfp-viewport");
      const cs = getComputedStyle(v);
      return { w: v.clientWidth, h: v.clientHeight, pad: cs.padding, ovX: v.scrollWidth - v.clientWidth, ovY: v.scrollHeight - v.clientHeight };
    })(),
    header: (() => {
      const h = document.querySelector(".mfp-header");
      const cs = h ? getComputedStyle(h) : null;
      return h ? { h: Math.round(h.getBoundingClientRect().height), bg: cs.backgroundColor, backdrop: cs.backdropFilter } : null;
    })(),
    footer: (() => {
      const f = document.querySelector(".mfp-mobile-footer");
      const cs = f ? getComputedStyle(f) : null;
      return f ? { h: Math.round(f.getBoundingClientRect().height), bg: cs.backgroundColor, display: cs.display } : null;
    })(),
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
