// Scratch probe: every visible element under a font-size floor, with its owner.
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4187";
const KEY = "mushaf-plus-settings";
const W = Number(process.env.W || 320);
const FLOOR = Number(process.env.FLOOR || 10);

const seedFn = (args) => {
  localStorage.setItem(args.key, JSON.stringify({
    skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: true,
    displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
    quranFontSize: 34, lang: args.lang, theme: "light",
    lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
  }));
};

const PROBE = (floor) => {
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    if (!el.textContent || !el.textContent.trim()) continue;
    if (el.querySelector("*")) continue; // leaves only
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const px = parseFloat(cs.fontSize);
    if (px >= floor) continue;
    // Quran text is exempt: its size is the user's reading setting.
    const fam = cs.fontFamily || "";
    const isQuran = /Amiri Quran|Uthmanic|qpc|KFGQPC/i.test(fam) ||
      el.closest("[data-quran-text],[data-quran-word],.qcm-word,.quran-text");
    out.push({
      px: +px.toFixed(2),
      tag: el.tagName.toLowerCase(),
      cls: (el.className || "").toString().slice(0, 60),
      parent: el.parentElement ? el.parentElement.tagName.toLowerCase() + "." + (el.parentElement.className || "").toString().split(/\s+/).slice(0, 2).join(".") : "",
      text: el.textContent.trim().slice(0, 28),
      quran: isQuran,
    });
  }
  const seen = new Map();
  for (const o of out.sort((a, b) => a.px - b.px)) {
    const k = `${o.tag}.${o.cls}|${o.parent}`;
    if (!seen.has(k)) seen.set(k, o);
  }
  return [...seen.values()];
};

const browser = await chromium.launch();
for (const lang of ["fr", "ar"]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(seedFn, { key: KEY, lang });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const res = await page.evaluate(PROBE, FLOOR);
  console.log(`\n##### ${lang} @${W}px — ${res.length} distinct sous ${FLOOR}px`);
  for (const o of res) {
    console.log(`  ${String(o.px).padStart(6)}px ${o.quran ? "QURAN " : "      "}${o.tag}.${o.cls}  <- ${o.parent}  "${o.text}"`);
  }
  await ctx.close();
}
await browser.close();
