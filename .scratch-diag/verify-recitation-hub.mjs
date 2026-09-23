import { chromium, devices } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4187";
const OUT = ".scratch-diag/captures/recitation";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function open({ lang = "fr", theme = "light" } = {}) {
  const ctx = await browser.newContext(devices["iPhone 12"]);
  const p = await ctx.newPage();
  await p.addInitScript(
    ([seed]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed)),
    [{ theme, lang, riwaya: "hafs", showTajwid: false, displayMode: "list", currentPage: 2 }],
  );
  await p.goto(BASE, { waitUntil: "domcontentloaded" });
  await p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ }).first().click({ timeout: 8000 }).catch(() => {});
  await p.waitForSelector(".splash-screen", { state: "detached", timeout: 15000 }).catch(() => {});
  await p.waitForSelector('button[role="tab"]', { timeout: 20000 });
  await p.locator('button[role="tab"]', { hasText: /Audio|الصوتيات/ }).first().click();
  await p.waitForTimeout(1500);
  return { ctx, p };
}

// ── Hub sans tap : la carte doit rester équilibrée ──────────────────────
{
  const { ctx, p } = await open();
  await p.evaluate(() => document.fonts.ready);
  await p.locator(".reciter-card").first().scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  console.log("hub:", JSON.stringify(await p.evaluate(() => {
    const rows = [...document.querySelectorAll(".reciter-card")].slice(0, 6).map((card) => {
      const r = card.getBoundingClientRect();
      const main = card.querySelector(".reciter-card__main").getBoundingClientRect();
      const act = card.querySelector(".reciter-card__actions").getBoundingClientRect();
      const name = card.querySelector(".reciter-card__name").getBoundingClientRect();
      const scroll = card.scrollWidth > Math.ceil(r.width) + 1;
      return {
        card: `${r.width.toFixed(0)}x${r.height.toFixed(0)}`,
        main: `${main.width.toFixed(0)}x${main.height.toFixed(0)}`,
        actions: `${act.width.toFixed(0)}x${act.height.toFixed(0)}`,
        name: `${name.width.toFixed(0)}x${name.height.toFixed(0)}`,
        overflowX: scroll,
      };
    });
    return { rows, docOverflow: document.documentElement.scrollWidth > innerWidth };
  }), null, 1));
  await p.locator(".reciter-card").first().screenshot({ path: `${OUT}/30-card-390.png` });
  await p.screenshot({ path: `${OUT}/31-hub-390.png` });
  await ctx.close();
}

// ── Hub arabe : mêmes cartes en RTL ─────────────────────────────────────
{
  const { ctx, p } = await open({ lang: "ar" });
  await p.locator(".reciter-card").first().scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  await p.locator(".reciter-card").first().screenshot({ path: `${OUT}/32-card-ar.png` });
  await ctx.close();
}

// ── Bloc sources de la fiche ────────────────────────────────────────────
{
  const { ctx, p } = await open();
  await p.locator(".reciter-card").first().tap();
  await p.waitForSelector(".reciter-detail", { timeout: 10000 });
  await p.waitForTimeout(2000);
  const box = p.locator(".reciter-detail__sources").first();
  if (await box.count()) {
    await box.scrollIntoViewIfNeeded();
    await p.waitForTimeout(500);
    await box.screenshot({ path: `${OUT}/33-sources.png` });
    console.log("sources:", JSON.stringify(await box.evaluate((el) => {
      return [...el.querySelectorAll("a")].map((a) => {
        const r = a.getBoundingClientRect();
        return { txt: a.textContent.trim().slice(0, 18), w: +r.width.toFixed(1), h: +r.height.toFixed(1), cls: a.className.slice(0, 40) };
      });
    }), null, 1));
  } else {
    console.log("sources: bloc absent pour ce récitateur");
  }
  await ctx.close();
}

await browser.close();
console.log("OK");
