// Scratch: is the Audio-tab dot actually painted? Not for commit.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4194";
const KEY = "mushaf-plus-settings";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 1000 } });
const page = await ctx.newPage();
await page.addInitScript((k) => localStorage.setItem(k, JSON.stringify({
  skipSplashAnimation: true, showHome: true, showDuas: false, sidebarOpen: false,
  displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
  quranFontSize: 34, lang: "fr", theme: "light", lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 } })), KEY);
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(800);
const r = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button[role="tab"]')].find((b) => /Audio/.test(b.innerText));
  const badge = btn.querySelector("span[aria-hidden]");
  if (!badge) return { noBadge: true, btnHtml: btn.outerHTML.slice(0, 400) };
  const cs = getComputedStyle(badge);
  const rr = badge.getBoundingClientRect();
  const cx = rr.left + rr.width / 2, cy = rr.top + rr.height / 2;
  const hit = document.elementFromPoint(cx, cy);
  const inner = badge.querySelector("span");
  return {
    bg: cs.backgroundColor, opacity: cs.opacity, disp: cs.display, vis: cs.visibility, z: cs.zIndex,
    rect: { x: +rr.x.toFixed(1), y: +rr.y.toFixed(1), w: +rr.width.toFixed(1) },
    hit: hit ? `${hit.tagName.toLowerCase()}.${(hit.className || "").toString().slice(0, 40)}` : null,
    innerAnim: inner ? getComputedStyle(inner).animationName + " " + getComputedStyle(inner).opacity : null,
    btnOv: getComputedStyle(btn).overflow,
    scrollY: window.scrollY,
  };
});
console.log(JSON.stringify(r, null, 1));
const box = await (await page.$('button[role="tab"]:has-text("Audio")')).boundingBox();
await page.screenshot({ path: ".scratch-diag/resp/tab-badge2.png", clip: { x: box.x - 20, y: box.y - 20, width: box.width + 44, height: box.height + 40 } });
await browser.close();
