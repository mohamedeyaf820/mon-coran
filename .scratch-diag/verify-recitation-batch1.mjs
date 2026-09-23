import { chromium, devices } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4187";
const OUT = ".scratch-diag/captures/recitation";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const SEED = (theme, lang) => [{ theme, lang, riwaya: "hafs", showTajwid: false, displayMode: "list", currentPage: 2 }];

async function open({ mobile = true, lang = "fr", theme = "light", reducedMotion = null } = {}) {
  const ctx = await browser.newContext(
    mobile
      ? { ...devices["iPhone 12"], reducedMotion: reducedMotion ?? undefined }
      : { viewport: { width: 1280, height: 900 }, reducedMotion: reducedMotion ?? undefined },
  );
  const p = await ctx.newPage();
  await p.addInitScript(([seed]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed)), SEED(theme, lang));
  await p.goto(BASE, { waitUntil: "domcontentloaded" });
  await p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ }).first().click({ timeout: 8000 }).catch(() => {});
  await p.waitForSelector(".splash-screen", { state: "detached", timeout: 15000 }).catch(() => {});
  await p.waitForSelector('button[role="tab"]', { timeout: 20000 });
  await p.locator('button[role="tab"]', { hasText: /Audio|الصوتيات/ }).first().click();
  await p.waitForTimeout(1200);
  await p.locator(".reciter-card").first().scrollIntoViewIfNeeded();
  await p.waitForTimeout(600);
  return { ctx, p };
}

// Mesure toutes les cibles interactives visibles d'un conteneur.
async function targets(p, sel) {
  return p.evaluate((selector) => {
    const out = [];
    for (const el of document.querySelectorAll(selector)) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      out.push({ cls: el.className.toString().slice(0, 60), w: +r.width.toFixed(1), h: +r.height.toFixed(1) });
    }
    return out;
  }, sel);
}

function report(label, list, min = 44) {
  const byClass = new Map();
  for (const t of list) {
    const k = t.cls;
    const cur = byClass.get(k);
    if (!cur) byClass.set(k, { ...t, n: 1 });
    else {
      cur.n += 1;
      cur.w = Math.min(cur.w, t.w);
      cur.h = Math.min(cur.h, t.h);
    }
  }
  const bad = [...byClass.values()].filter((t) => t.w < min - 0.6 || t.h < min - 0.6);
  console.log(`\n${label}: ${list.length} cibles / ${byClass.size} classes, ${bad.length} classe(s) sous ${min}px`);
  for (const b of bad) console.log(`  LOW ${b.w}x${b.h} x${b.n}  ${b.cls}`);
}

// ── A. Hub tactile : cibles + absence de hover collant ──────────────────
{
  const { ctx, p } = await open();
  const media = await p.evaluate(() => ({
    hover: matchMedia("(hover: hover)").matches,
    fine: matchMedia("(pointer: fine)").matches,
  }));
  console.log("A. hub tactile media:", JSON.stringify(media));
  report("A.reciter-card", await targets(p, ".reciter-card__main, .reciter-card__favorite, .reciter-card__listen, .home-style-filter, .home-reciter-load-more"));
  // Après un tap, la carte ne doit pas rester levée (hover collant).
  await p.locator(".reciter-card").first().tap();
  await p.waitForTimeout(1200);
  console.log("A.après tap transform carte:", await p.evaluate(() => {
    const c = document.querySelector(".reciter-card");
    return c ? getComputedStyle(c).transform : "absent";
  }));
  await p.screenshot({ path: `${OUT}/20-hub-touch-390.png` });
  await ctx.close();
}

// ── B. Fiche récitateur tactile : cibles + hero + avatar ────────────────
{
  const { ctx, p } = await open();
  await p.locator(".reciter-card").first().tap();
  await p.waitForSelector(".reciter-detail", { timeout: 10000 });
  await p.waitForTimeout(2500);
  report("B.detail", await targets(p, ".reciter-detail button, .reciter-detail a, .reciter-detail input"));
  console.log("B.hero:", JSON.stringify(await p.evaluate(() => {
    const bg = document.querySelector(".rd-hero-bg");
    const portrait = document.querySelector(".reciter-hero__portrait");
    const accent = document.querySelector(".reciter-detail__accent");
    return {
      bgImage: bg ? getComputedStyle(bg).backgroundImage.slice(0, 200) : null,
      ringAnim: portrait ? getComputedStyle(portrait, "::before").animationName : null,
      afterContent: portrait ? getComputedStyle(portrait, "::after").content : null,
      accentAnim: accent ? `${getComputedStyle(accent).animationName}/${getComputedStyle(accent).animationIterationCount}` : null,
      accentOpacity: accent ? getComputedStyle(accent).opacity : null,
    };
  }), null, 1));
  await p.screenshot({ path: `${OUT}/21-detail-touch-390.png` });
  await p.locator(".reciter-hero").first().screenshot({ path: `${OUT}/22-hero-touch.png` }).catch(() => {});
  await ctx.close();
}

// ── C. Desktop : le survol doit toujours fonctionner ────────────────────
{
  const { ctx, p } = await open({ mobile: false });
  await p.screenshot({ path: `${OUT}/23-hub-1280.png` });
  const card = p.locator(".reciter-card").first();
  await card.hover();
  await p.waitForTimeout(500);
  console.log("C.hover carte transform:", await card.evaluate((el) => getComputedStyle(el).transform));
  await p.locator(".reciter-card__listen").first().hover();
  await p.waitForTimeout(400);
  console.log("C.hover listen bg:", await p.evaluate(() => {
    const el = document.querySelector(".reciter-card__listen");
    return getComputedStyle(el).backgroundColor;
  }));
  await ctx.close();
}

// ── D. Mouvement réduit ─────────────────────────────────────────────────
{
  const { ctx, p } = await open({ reducedMotion: "reduce" });
  console.log("D.réduit:", JSON.stringify(await p.evaluate(() => {
    const m = document.querySelector(".reciter-card[data-playing='true']") ? 1 : 0;
    const card = document.querySelector(".reciter-card");
    const bars = document.querySelector(".reciter-card__playing i");
    return {
      cardTransition: card ? getComputedStyle(card).transitionProperty : null,
      barsAnim: bars ? getComputedStyle(bars).animationName : "aucune carte en lecture",
      loopCount: [...document.querySelectorAll(".reciter-card, .reciter-card *, .reciter-card *::after")].length,
    };
  }), null, 1));
  await ctx.close();
}

// ── E. Arabe RTL + sombre ───────────────────────────────────────────────
{
  const { ctx, p } = await open({ lang: "ar", theme: "dark" });
  await p.screenshot({ path: `${OUT}/24-hub-ar-dark.png` });
  await p.locator(".reciter-card").first().tap();
  await p.waitForSelector(".reciter-detail", { timeout: 10000 });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/25-detail-ar-dark.png` });
  await ctx.close();
}

await browser.close();
console.log("\nOK");
