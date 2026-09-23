import { chromium, devices } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4187";
const OUT = ".scratch-diag/captures/recitation";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function run(label, { lang, theme }) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(
    ([seed]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed)),
    [{ theme, lang, riwaya: "hafs", showTajwid: false, displayMode: "mushaf", currentPage: 2 }],
  );
  await p.goto(BASE, { waitUntil: "domcontentloaded" });
  await p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ }).first().click({ timeout: 8000 }).catch(() => {});
  await p.waitForSelector(".splash-screen", { state: "detached", timeout: 15000 }).catch(() => {});
  await p.waitForSelector('button[role="tab"]', { timeout: 20000 });
  await p.locator('button[role="tab"]', { hasText: /Audio|الصوتيات/ }).first().click();
  await p.waitForTimeout(2000);
  const closed = await p.evaluate(() => {
    const b = [...document.querySelectorAll('button[aria-label*="إغلاق"], button[aria-label*="قفل"], button[aria-label*="Fermer"], button[aria-label*="Close" i]')].find((x) => x.getBoundingClientRect().width > 0);
    if (b) b.click();
    return b?.getAttribute("aria-label") || null;
  });
  console.log(label, "closed:", closed);
  await p.waitForTimeout(800);
  await p.evaluate(() => document.fonts.ready);

  const clip = await p.evaluate(() => {
    const cards = [...document.querySelectorAll(".reciter-card")].filter((c) => c.getBoundingClientRect().width > 40);
    if (cards.length < 3) return { err: cards.length };
    cards[0].scrollIntoView({ block: "center", behavior: "instant" });
    return { ok: true };
  });
  if (clip.err) { console.log(label, "ERR cards:", clip.err); await ctx.close(); return; }
  await p.waitForTimeout(1500);
  const geo = await p.evaluate(() => {
    const cards = [...document.querySelectorAll(".reciter-card")].filter((c) => c.getBoundingClientRect().width > 40);
    const a = cards[0].getBoundingClientRect();
    const last = cards[2].getBoundingClientRect();
    const hit = document.elementFromPoint(a.x + a.width / 2, a.y + a.height / 2);
    return {
      inView: hit ? cards[0].contains(hit) : false,
      one: { x: a.x - 2, y: a.y - 2, width: a.width + 4, height: a.height + 4 },
      three: { x: a.x - 2, y: Math.max(0, a.y - 2), width: a.width + 4, height: Math.min(innerHeight - Math.max(0, a.y - 2), last.bottom - a.top + 4) },
    };
  });
  console.log(label, "hitTest:", geo.inView);
  await p.locator(".reciter-card").nth(0).screenshot({ path: `${OUT}/${label}-card.png` });
  await p.evaluate(() => document.querySelectorAll(".reciter-card")[0].scrollIntoView({ block: "start", behavior: "instant" }));
  await p.waitForTimeout(400);
  await p.locator(".hp-list").first().screenshot({ path: `${OUT}/${label}-list.png` }).catch(async () => {
    await p.screenshot({ path: `${OUT}/${label}-list.png` });
  });
  await p.screenshot({ path: `${OUT}/${label}-full.png` });
  await ctx.close();
}

await run("50-ar", { lang: "ar", theme: "light" });
await run("51-ar-dark", { lang: "ar", theme: "dark" });
await run("52-fr-dark", { lang: "fr", theme: "dark" });

await browser.close();
console.log("OK");
