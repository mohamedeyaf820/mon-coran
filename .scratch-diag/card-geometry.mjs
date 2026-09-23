// Scratch diagnostic — not for commit.
// Geometry of the first reciter card at a given width.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL || "http://127.0.0.1:4192";
const W = Number(process.env.W || 280);
const browser = await chromium.launch();
const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: W, height: 780 } });
await ctx.addInitScript(() => {
  localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({ skipSplashAnimation: true, showHome: true, lang: "fr", theme: "light" }),
  );
});
const page = await ctx.newPage();
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector('.home-content-toolbar [role="tab"]', { timeout: 25000 });
await page.locator('.home-content-toolbar [role="tab"]').nth(2).click();
await page.waitForSelector(".reciter-card", { timeout: 25000 });
console.log(
  JSON.stringify(
    await page.evaluate(() => {
      const card = document.querySelector(".reciter-card");
      const box = (e) => e.getBoundingClientRect().width.toFixed(1);
      const cs = getComputedStyle(card);
      const walk = (e, depth) => {
        const lines = [];
        for (const c of e.children) {
          lines.push(
            `${"  ".repeat(depth)}${c.tagName.toLowerCase()}.${String(c.className).split(" ").slice(0, 2).join(".")} w=${box(c)}`,
          );
          if (depth < 2) lines.push(...walk(c, depth + 1));
        }
        return lines;
      };
      return {
        card: box(card),
        display: cs.display,
        columns: cs.gridTemplateColumns,
        tree: walk(card, 0),
      };
    }),
    null,
    1,
  ),
);
await browser.close();
