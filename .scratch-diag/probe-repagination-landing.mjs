import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "fr", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
})));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
const s = page.locator(".splash-screen button").filter({ hasText: /Passer|Skip/ }).first();
if (await s.count()) await s.click({ force: true }).catch(() => {});
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 15000 });
await page.waitForTimeout(1200);

await page.evaluate(() => { document.querySelector(".app-main").scrollTop = 1500; });
await page.waitForTimeout(300);
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button[aria-label*="Plus"], .mp-header-more'));
  btns[btns.length - 1]?.click();
});
await page.waitForTimeout(400);
await page.evaluate(() => {
  window.__scrollLog = [];
  const orig = Element.prototype.scrollTo;
  Element.prototype.scrollTo = function (...args) {
    if (this.classList?.contains("app-main")) {
      window.__scrollLog.push({ t: Math.round(performance.now()), args: JSON.stringify(args), stack: (new Error().stack || "").split("\n").slice(1, 4).join(" | ") });
    }
    return orig.apply(this, args);
  };
  const desc = Object.getOwnPropertyDescriptor(Element.prototype, "scrollTop");
  Object.defineProperty(Element.prototype, "scrollTop", {
    configurable: true,
    get() { return desc.get.call(this); },
    set(v) {
      if (this.classList?.contains("app-main")) {
        window.__scrollLog.push({ t: Math.round(performance.now()), args: `set=${v}`, stack: (new Error().stack || "").split("\n").slice(1, 4).join(" | ") });
      }
      desc.set.call(this, v);
    },
  });
});
await page.evaluate(() => {
  Array.from(document.querySelectorAll(".mp-header-menu button")).find((b) => /Mushaf/.test(b.textContent || ""))?.click();
});
await page.waitForTimeout(2500);

const report = await page.evaluate(() => {
  const c = document.querySelector(".app-main");
  const cr = c.getBoundingClientRect();
  const sections = Array.from(document.querySelectorAll("[data-stream-page]")).map((el) => ({
    page: el.getAttribute("data-stream-page"),
    offset: Math.round(el.getBoundingClientRect().top - cr.top),
    height: Math.round(el.getBoundingClientRect().height),
  }));
  const header = document.querySelector(".app-header, header")?.getBoundingClientRect().height;
  return { scrollTop: c.scrollTop, sections, header };
});
console.log(JSON.stringify(report, null, 1));
console.log("scroll log:", JSON.stringify(await page.evaluate(() => window.__scrollLog), null, 1));
await page.screenshot({ path: ".scratch-diag/repagination-landing.png" });
await browser.close();
