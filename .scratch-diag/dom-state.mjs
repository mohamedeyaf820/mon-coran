// scratch: which element actually scrolls on each surface, and what is animated/painted there.
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4294";
const SETTINGS_KEY = "mushaf-plus-settings";
const args = process.argv.slice(2);
const view = args[0] || "read-list";

const VIEWS = {
  "read-list": { url: "/surah/2", ovr: { showHome: false, mushafLayout: "list" }, wait: ".qc-ayah-text-ar" },
  "read-mushaf": { url: "/surah/2", ovr: { showHome: false, mushafLayout: "mushaf" }, wait: ".app-view-reading" },
  "read-page": { url: "/page/50", ovr: { showHome: false, displayMode: "page" }, wait: ".app-view-reading" },
  "reciter-hub": { url: "/", ovr: { showHome: true }, wait: '.home-content-toolbar [role="tab"]', tab: 2 },
  "reciter-detail": {
    url: "/",
    ovr: { showHome: true },
    wait: '.home-content-toolbar [role="tab"]',
    pre: [{ tab: 2 }, { wait: ".reciter-card__main" }, { click: ".reciter-card__main" }],
  },
  fullscreen: { url: "/surah/2", ovr: { showHome: false, mushafLayout: "mushaf" }, wait: ".app-view-reading", btn: ".srh-fullscreen-btn, .reader-fullscreen-trigger" },
};

const v = VIEWS[view];
const browser = await chromium.launch();
const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 390, height: 780 } });
await ctx.addInitScript(
  (a) => {
    localStorage.setItem(
      a.key,
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: true,
        sidebarOpen: false,
        homeSection: "surah",
        riwaya: "hafs",
        fontFamily: "qpc-hafs",
        lang: "fr",
        theme: "light",
        ...a.ovr,
      }),
    );
    localStorage.setItem("mushaf-plus-onboarded", "1");
  },
  { key: SETTINGS_KEY, ovr: v.ovr },
);
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(String(e.message).slice(0, 100)));
await page.goto(BASE + v.url, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector(v.wait, { timeout: 40000 }).catch(() => errs.push("wait:" + v.wait));
if (v.tab != null) {
  await page.locator('.home-content-toolbar [role="tab"]').nth(v.tab).click().catch(() => {});
  await page.waitForTimeout(1500);
}
for (const s of v.pre || []) {
  if (s.tab != null) {
    await page.locator('.home-content-toolbar [role="tab"]').nth(s.tab).click().catch(() => {});
    await page.waitForTimeout(1500);
  }
  if (s.wait) await page.waitForSelector(s.wait, { timeout: 20000 }).catch(() => {});
  if (s.click) await page.locator(s.click).first().click().catch(() => {});
  await page.waitForTimeout(1500);
}
if (v.btn) {
  await page.locator(v.btn).first().click().catch(() => {});
  await page.waitForTimeout(3000);
}
await page.waitForTimeout(2500);

const info = await page.evaluate(() => {
  const cls = (el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ").filter(Boolean).slice(0, 2).join(".")}`;
  const scrollers = [...document.querySelectorAll("*")]
    .filter((el) => {
      const cs = getComputedStyle(el);
      return /(auto|scroll|overlay)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 60 && el.clientHeight > 150;
    })
    .map((el) => ({ el, s: `${cls(el)} ${el.scrollHeight}>${el.clientHeight} ov:${getComputedStyle(el).overflowY} bf:${getComputedStyle(el).backdropFilter !== "none"}` }));
  const infinite = [...document.querySelectorAll("*")]
    .filter((el) => {
      const cs = getComputedStyle(el);
      return cs.animationName !== "none" && cs.animationIterationCount === "infinite" && el.getBoundingClientRect().width > 0;
    })
    .map((el) => `${cls(el)}:${getComputedStyle(el).animationName}`);
  const blurred = [...document.querySelectorAll("*")]
    .filter((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.backdropFilter !== "none" && r.width > 60 && r.height > 20;
    })
    .map((el) => {
      const r = el.getBoundingClientRect();
      return `${cls(el)} ${Math.round(r.width)}x${Math.round(r.height)} pos:${getComputedStyle(el).position}`;
    });
  const sticky = [...document.querySelectorAll("*")]
    .filter((el) => ["sticky", "fixed"].includes(getComputedStyle(el).position) && el.getBoundingClientRect().width > 60)
    .map((el) => cls(el));
  return {
    nodes: document.getElementsByTagName("*").length,
    scrollers: scrollers.map((x) => x.s).slice(0, 10),
    infinite: [...new Set(infinite)].slice(0, 12),
    blurred: [...new Set(blurred)].slice(0, 12),
    sticky: [...new Set(sticky)].slice(0, 12),
    words: document.querySelectorAll(".qcm-word").length,
    sheets: document.querySelectorAll("[data-stream-page],.mfp-page,.qcm-page").length,
  };
});
console.log(view, JSON.stringify({ errs, ...info }, null, 1));
await page.screenshot({ path: `.scratch-diag/resp/dom-${view}.png` }).catch(() => {});
await browser.close();
