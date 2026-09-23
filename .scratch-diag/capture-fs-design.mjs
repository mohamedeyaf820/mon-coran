import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/fs-design";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function open({ page = "572", w = 390, h = 844, theme, riwaya, tajwid = true, zoom, label }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(([seed]) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed));
  }, [{ theme, riwaya, showTajwid: tajwid, displayMode: "page", mushafLayout: "list", currentPage: Number(page) }]);
  await p.goto(`${BASE}/page/${page}`, { waitUntil: "domcontentloaded" });
  const skip = p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
  if (await skip.count()) {
    await skip.first().click().catch(() => {});
    await p.waitForSelector(".splash-screen", { state: "detached", timeout: 8000 }).catch(() => {});
  }
  await p.waitForSelector(".mushaf-page-wrapper, .cpv-flow, .qc-ayah-text-ar", { timeout: 20000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1200);
  await p.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn, button[aria-label*='lein']").first().click();
  await p.waitForSelector(".mfp-portal-root .qcm-lines", { timeout: 20000 });
  await p.evaluate(() => document.fonts.ready);
  if (zoom) {
    await p.evaluate((z) => {
      const el = document.querySelector(".mfp-book");
      el.style.zoom = z;
    }, zoom);
  }
  await p.waitForTimeout(2200);
  await p.screenshot({ path: `${OUT}/${label}.png` });
  const crops = {
    header: ".mfp-header",
    sheet: ".mfp-portal-root .qcm-page-shell",
    band: ".qcm-line--surah-header",
    basmala: ".qcm-line--basmala",
    folio: ".qcm-page-footer",
    line4: ".qcm-line[data-line-number='4']",
    line5: ".qcm-line[data-line-number='5']",
    mobileFooter: ".mfp-mobile-footer",
  };
  for (const [name, sel] of Object.entries(crops)) {
    const loc = p.locator(sel).first();
    if (await loc.count()) {
      await loc.screenshot({ path: `${OUT}/${label}--${name}.png` }).catch(() => {});
    }
  }
  const metrics = await p.evaluate(() => {
    const r = (s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), fs: cs.fontSize, lines: cs.lineHeight };
    };
    const vp = document.querySelector(".mfp-viewport");
    return {
      layout: document.querySelector(".mfp-portal-root")?.dataset.layout,
      header: r(".mfp-header"),
      headerH2: r(".mfp-header__copy h2"),
      sheet: r(".mfp-portal-root .qcm-page-shell"),
      page: r(".qcm-page"),
      lines: r(".qcm-lines"),
      line1: r(".qcm-line--surah-header"),
      folio: r(".qcm-page-folio"),
      mobileFooter: r(".mfp-mobile-footer"),
      vp: vp && { top: Math.round(vp.getBoundingClientRect().top), bottom: Math.round(vp.getBoundingClientRect().bottom), pad: getComputedStyle(vp).padding, ovY: vp.scrollHeight - vp.clientHeight },
      gapSheetToFooter: (() => {
        const s = document.querySelector(".qcm-page")?.getBoundingClientRect();
        const f = document.querySelector(".mfp-mobile-footer")?.getBoundingClientRect();
        return s && f ? Math.round(f.top - s.bottom) : null;
      })(),
    };
  });
  console.log(`\n### ${label}`, JSON.stringify(metrics, null, 1));
  await ctx.close();
}

await open({ label: "phone-light", theme: "light" });
await open({ label: "phone-dark", theme: "dark" });
await open({ label: "phone-warsh", theme: "light", riwaya: "warsh", page: "572" });
await open({ label: "tablet", w: 820, h: 1180, theme: "light" });
await open({ label: "desktop", w: 1440, h: 900, theme: "light" });
await open({ label: "phone-tajwid-off", theme: "light", tajwid: false });
await browser.close();
console.log("done");
