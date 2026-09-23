import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4187";
const OUT = ".scratch-diag/captures/recitation";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function open({ width = 390, height = 844, lang = "fr", theme = "light" }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
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
  await p.waitForTimeout(1000);
  await p.locator(".reciter-card").first().scrollIntoViewIfNeeded();
  await p.waitForTimeout(600);
  return { ctx, p };
}

// hub grid, light
{
  const { ctx, p } = await open({});
  await p.evaluate(() => document.fonts.ready);
  const grid = p.locator(".home-collection, .home-content-section, main").first();
  await grid.screenshot({ path: `${OUT}/10-hub-grid.png` }).catch(async () => p.screenshot({ path: `${OUT}/10-hub-grid.png` }));
  console.log(
    "metrics:",
    JSON.stringify(
      await p.evaluate(() => {
        const q = (s) => document.querySelector(s);
        const m = (el, props) => {
          const c = getComputedStyle(el);
          return Object.fromEntries(props.map((pr) => [pr, c.getPropertyValue(pr)]));
        };
        const card = q(".reciter-card");
        const listen = q(".reciter-card__listen");
        const fav = q(".reciter-card__favorite");
        const filter = q(".home-style-filter");
        const more = q(".home-reciter-load-more");
        return {
          card: card ? m(card, ["border-radius", "background-color", "box-shadow", "transition"]) : null,
          listen: listen ? { ...m(listen, ["border-radius", "background-color"]), ...listen.getBoundingClientRect().toJSON() } : null,
          fav: fav ? fav.getBoundingClientRect().toJSON() : null,
          filter: filter ? { h: filter.getBoundingClientRect().height, ...m(filter, ["border-radius"]) } : null,
          more: more ? more.getBoundingClientRect().toJSON() : null,
        };
      }),
      null,
      1,
    ),
  );
  await ctx.close();
}

// detail hero, light + measures
{
  const { ctx, p } = await open({});
  await p.locator(".reciter-card").first().click();
  await p.waitForSelector(".reciter-detail", { timeout: 10000 });
  await p.waitForTimeout(2500);
  await p.locator(".reciter-detail__hero, .reciter-hero").first().screenshot({ path: `${OUT}/11-hero-light.png` }).catch(() => {});
  await p.screenshot({ path: `${OUT}/12-detail-light-full.png` });
  console.log(
    "hero:",
    JSON.stringify(
      await p.evaluate(() => {
        const hero = document.querySelector(".reciter-detail__hero") || document.querySelector(".reciter-hero");
        const accent = document.querySelector(".reciter-detail__accent");
        const eyebrow = document.querySelector(".reciter-detail__eyebrow, .reciter-hero__eyebrow");
        const c = getComputedStyle(hero);
        const anim = [...document.querySelectorAll(".reciter-detail *, .reciter-hero *")].filter((el) => {
          const s = getComputedStyle(el);
          return s.animationName !== "none" && s.animationIterationCount === "infinite";
        });
        return {
          bgImage: c.backgroundImage.slice(0, 220),
          bgAccent: accent ? getComputedStyle(accent).backgroundImage.slice(0, 160) : null,
          accentAnim: accent ? `${getComputedStyle(accent).animationName} ${getComputedStyle(accent).animationDuration} ${getComputedStyle(accent).animationIterationCount}` : null,
          eyebrowColor: eyebrow ? getComputedStyle(eyebrow).color : null,
          infinite: anim.map((el) => `${el.className}=${getComputedStyle(el).animationName}/${getComputedStyle(el).animationDuration}/${getComputedStyle(el).animationIterationCount}`),
          portraitPulse: (() => {
            const el = document.querySelector(".reciter-hero__portrait");
            if (!el) return null;
            const s = getComputedStyle(el, "::before");
            return `${s.animationName}/${s.animationDuration}/${s.animationIterationCount}`;
          })(),
        };
      }),
      null,
      1,
    ),
  );
  await ctx.close();
}

// detail hero, dark
{
  const { ctx, p } = await open({ theme: "dark" });
  await p.locator(".reciter-card").first().click();
  await p.waitForSelector(".reciter-detail", { timeout: 10000 });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/13-detail-dark-full.png` });
  await ctx.close();
}

// player: play a surah, capture compact + expanded + options modal
{
  const { ctx, p } = await open({});
  await p.locator(".reciter-card").first().click();
  await p.waitForSelector(".reciter-detail", { timeout: 10000 });
  await p.waitForTimeout(1500);
  await p.locator(".recitation-row .recitation-action-btn--primary, .recitation-row [aria-label*='ouer'], .recitation-row button").first().click().catch(() => {});
  await p.waitForTimeout(3500);
  const player = await p.evaluate(() => {
    const el = document.querySelector(".audio-player-simple, .simple-player, .mp-audio-player");
    return el ? { cls: el.className, h: Math.round(el.getBoundingClientRect().height) } : null;
  });
  console.log("player:", JSON.stringify(player));
  await p.screenshot({ path: `${OUT}/14-player-compact.png` });
  await p.locator(".simple-player__expand, .audio-player__expand, [aria-label*='tendre'], [aria-label*='xpand']").first().click().catch(() => {});
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/15-player-open.png` });
  await ctx.close();
}

// desktop hub
{
  const { ctx, p } = await open({ width: 1280, height: 900 });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${OUT}/16-hub-1280.png` });
  await ctx.close();
}

await browser.close();
