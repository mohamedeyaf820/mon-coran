import { chromium } from "@playwright/test";
const BASE = "http://127.0.0.1:4294";
const b = await chromium.launch();
const ctx = await b.newContext({ serviceWorkers: "block", viewport: { width: 390, height: 780 } });
await ctx.addInitScript(() => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, showHome: true, sidebarOpen: false, homeSection: "audio", riwaya: "hafs", fontFamily: "qpc-hafs", lang: "fr", theme: "light" }));
  localStorage.setItem("mushaf-plus-onboarded", "1");
});
const p = await ctx.newPage();
await p.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForSelector('.home-content-toolbar [role="tab"]', { timeout: 30000 }).catch(() => {});
await p.locator('.home-content-toolbar [role="tab"]').nth(2).click();
await p.waitForTimeout(1500);
const cards = await p.locator(".reciter-card__main").count();
await p.locator(".reciter-card__main").first().click().catch(() => {});
await p.waitForTimeout(2000);
const info = await p.evaluate(() => {
  const ov = document.querySelector(".reciter-detail-overlay");
  const det = document.querySelector(".reciter-detail");
  const main = document.querySelector(".app-main");
  const anim = [...document.querySelectorAll("*")].filter((el) => {
    const cs = getComputedStyle(el);
    return cs.animationName !== "none" && cs.animationIterationCount === "infinite" && el.getBoundingClientRect().width > 0;
  }).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}:${getComputedStyle(el).animationName}`);
  return {
    cards: document.querySelectorAll(".reciter-card__main").length,
    overlay: !!ov,
    overlayBackdrop: ov ? getComputedStyle(ov).backdropFilter : null,
    detailScrollH: det ? det.scrollHeight : null,
    detailClientH: det ? det.clientHeight : null,
    mainScrollH: main ? main.scrollHeight : null,
    mainClientH: main ? main.clientHeight : null,
    nodes: document.getElementsByTagName("*").length,
    infinite: [...new Set(anim)].slice(0, 12),
    scrollers: [...document.querySelectorAll("*")].filter((el) => { const cs = getComputedStyle(el); return /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 60 && el.clientHeight > 150; }).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} ${el.scrollHeight}>${el.clientHeight}`).slice(0, 8),
  };
});
console.log(JSON.stringify({ cards, ...info }, null, 1));
await p.screenshot({ path: ".scratch-diag/resp/rd-4294.png" });
await b.close();
