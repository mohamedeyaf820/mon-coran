// Scratch captures of the worst responsive defects. Not for commit.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:4187";
const KEY = "mushaf-plus-settings";
const OUT = ".scratch-diag/resp/shots";
mkdirSync(OUT, { recursive: true });

function seed(args) {
  const { key, o } = args;
  localStorage.setItem(key, JSON.stringify({
    skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
    displayMode: "surah", mushafLayout: "list", riwaya: "hafs", fontFamily: "qpc-hafs",
    quranFontSize: 34, lang: "fr", theme: "light",
    lastPosition: { surah: 2, ayah: 1, page: 2, juz: 1 }, ...o,
  }));
}

const b = await chromium.launch();

async function shot(name, { url, o, w, h = 800, sel, wait }) {
  const ctx = await b.newContext({ serviceWorkers: "block", viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await ctx.addInitScript(seed, { key: KEY, o });
  const p = await ctx.newPage();
  await p.goto(BASE + url, { waitUntil: "domcontentloaded" });
  await p.waitForSelector(wait, { timeout: 25_000 }).catch(() => {});
  await p.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 15_000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await p.locator(sel).first().screenshot({ path: `${OUT}/${name}.png` }).catch(async (e) => {
    console.log(`!! ${name}: ${String(e.message).slice(0, 80)}`);
    await p.screenshot({ path: `${OUT}/${name}.png` });
  });
  const box = await p.locator(sel).first().boundingBox().catch(() => null);
  console.log(`${name}: ${box ? `${box.width.toFixed(1)}x${box.height.toFixed(1)}` : "n/a"}`);
  await ctx.close();
}

// P1 : titre d'en-tête effondré à 280 px
await shot("01-title-280-duas", { url: "/duas", o: { showDuas: true }, w: 280, sel: ".mp-header__bar", wait: ".duas-page" });
await shot("02-title-280-read", { url: "/surah/2", o: {}, w: 280, sel: ".mp-header__bar", wait: ".qc-ayah-text-ar" });
await shot("03-title-320-read", { url: "/surah/2", o: {}, w: 320, sel: ".mp-header__bar", wait: ".qc-ayah-text-ar" });

// P1 : référence de verset rognée (44px carré, texte « 2:255 »)
await shot("04-ref-1024-juz", { url: "/juz/3", o: { displayMode: "juz" }, w: 1024, h: 1000, sel: ".qc-list-card__reference", wait: ".qc-list-card__reference" });
await shot("05-ref-1920-juz", { url: "/juz/3", o: { displayMode: "juz" }, w: 1920, h: 1000, sel: ".qc-list-card__reference", wait: ".qc-list-card__reference" });
await shot("06-ref-1024-page", { url: "/page/50", o: { displayMode: "page" }, w: 1024, h: 1000, sel: ".qc-list-card__reference", wait: ".qc-list-card__reference" });

// P1 : onglet « Audio » rogné à >=768
await shot("07-tab-audio-1024", { url: "/", o: { showHome: true }, w: 1024, h: 1000, sel: ".home-content-toolbar", wait: ".home-content-toolbar" });
await shot("08-tab-audio-1920", { url: "/", o: { showHome: true }, w: 1920, h: 1000, sel: ".home-content-toolbar", wait: ".home-content-toolbar" });

// P2 : footer minuscule + liens de 30 px
await shot("09-footer-390", { url: "/", o: { showHome: true }, w: 390, h: 900, sel: ".mp-footer-v2", wait: ".hp-card" });

await b.close();
console.log("OK");
