import { webkit } from "playwright";
const BASE = "http://127.0.0.1:4173";
const browser = await webkit.launch();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" })).newPage();
await page.goto(BASE, { waitUntil: "domcontentloaded" });
if (await page.locator(".splash-screen").count()) {
  await page.locator(".splash-screen button", { hasText: /Passer/ }).first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
}
await page.waitForTimeout(2000);
const info = await page.evaluate(() => {
  const card = document.querySelector('div[role="note"]');
  if (!card) return { exists: false };
  const r = card.getBoundingClientRect();
  const cs = getComputedStyle(card);
  const parent = card.parentElement;
  return { exists: true, rect: { x: r.x, y: r.y, w: r.width, h: r.height }, display: cs.display, visibility: cs.visibility, opacity: cs.opacity, parentChain: (() => { let p = card, chain = []; while (p && p !== document.body) { const s = getComputedStyle(p); if (s.display === "none" || s.visibility === "hidden") chain.push(p.className || p.tagName + "(hidden)"); p = p.parentElement; } return chain; })() };
});
console.log(JSON.stringify(info));
await browser.close();
process.exit(0);
