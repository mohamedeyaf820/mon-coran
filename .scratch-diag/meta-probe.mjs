// Scratch diagnostic — not for commit.
// Why is the reciter-card meta line ellipsised at 280px?
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4192";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  serviceWorkers: "block",
  viewport: { width: 280, height: 780 },
});
await ctx.addInitScript(() => {
  localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({
      skipSplashAnimation: true,
      showHome: true,
      lang: "fr",
      theme: "light",
      homeSection: "audio",
      riwaya: "hafs",
    }),
  );
});
const page = await ctx.newPage();
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".home-content-toolbar [role=\"tab\"]", { timeout: 25000 });
await page.locator('.home-content-toolbar [role="tab"]').nth(2).click();
await page.waitForSelector(".reciter-card__main", { timeout: 25000 });
await page.locator(".reciter-card__main").first().click();
await page.waitForTimeout(900);
const out = await page.evaluate(() => {
  const hits = [...document.querySelectorAll("span")].filter((s) =>
    /saoudite|SA|arabie/i.test(s.textContent || ""),
  );
  const box = (e) => {
    const r = e.getBoundingClientRect();
    return `${r.width.toFixed(1)}x${r.height.toFixed(1)}`;
  };
  const chain = (e) => {
    const parts = [];
    let n = e;
    while (n && parts.length < 5) {
      parts.push(n.className ? `${n.tagName.toLowerCase()}.${String(n.className).split(" ").slice(0, 2).join(".")}` : n.tagName.toLowerCase());
      n = n.parentElement;
    }
    return parts.join(" < ");
  };
  return hits.map((s) => {
    const cs = getComputedStyle(s);
    const pcs = getComputedStyle(s.parentElement);
    return {
      text: s.textContent,
      spanBox: box(s),
      scroll: s.scrollWidth,
      client: s.clientWidth,
      display: cs.display,
      overflow: cs.overflow,
      ellipsis: cs.textOverflow,
      ws: cs.whiteSpace,
      parentChain: chain(s.parentElement),
      parentBox: box(s.parentElement),
      parentDisplay: pcs.display,
      parentWrap: pcs.flexWrap,
      parentOverflow: pcs.overflow,
    };
  });
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
