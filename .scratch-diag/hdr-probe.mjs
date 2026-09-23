// Scratch probe: reader header centering at 320/390. Not for commit.
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4192";
const KEY = "mushaf-plus-settings";
const seed = (args) => {
  localStorage.setItem(
    args.key,
    JSON.stringify({
      skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
      displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
      quranFontSize: 34, lang: args.lang, theme: args.theme,
      lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 },
    }),
  );
};

const PROBE = () => {
  const b = (n) => {
    if (!n) return null;
    const r = n.getBoundingClientRect();
    const c = getComputedStyle(n);
    return {
      w: +r.width.toFixed(1), x: +r.x.toFixed(1), dx: +(r.left + r.width / 2 - innerWidth / 2).toFixed(2),
      disp: c.display, flex: c.flex, pos: c.position, ml: c.marginLeft, mr: c.marginRight,
      gap: c.gap, pi: c.paddingInline, ov: c.overflow,
    };
  };
  const q = (s) => document.querySelector(s);
  const header = q(".mp-header") || q("header");
  return {
    vw: innerWidth,
    header: b(header),
    headerChildren: header ? [...header.children].map((n) => ({
      cls: n.className.toString().slice(0, 46), ...b(n), kids: [...n.children].map((k) => ({
        cls: k.className.toString().slice(0, 40), t: (k.innerText || "").trim().replace(/\s+/g, " ").slice(0, 16), ...b(k),
      })),
    })) : null,
    nav: b(q(".mp-header__nav")),
    center: b(q(".mp-header__center")),
    title: b(q(".mp-header__title")),
    titleBtn: b(q(".mp-header__title-btn")),
    actions: b(q(".mp-header__actions")),
    back: b(q(".mp-header__back")),
  };
};

const browser = await chromium.launch();
for (const w of [320, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 780 } });
  const page = await ctx.newPage();
  await page.addInitScript(seed, { key: KEY, lang: "fr", theme: "light" });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll(".home-quick-row, .home-resume-panel__primary, [data-action=resume]")];
    (b.find((n) => /reprendre|lecture/i.test(n.innerText)) || b[0])?.click();
  });
  await page.waitForSelector(".mp-header__nav", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(900);
  const r = await page.evaluate(PROBE);
  console.log(JSON.stringify(r, null, 1));
  await page.screenshot({ path: `.scratch-diag/resp/hdr-${w}.png` });
  await ctx.close();
}
await browser.close();
