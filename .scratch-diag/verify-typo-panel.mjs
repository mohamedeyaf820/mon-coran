import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures";
fs.mkdirSync(OUT, { recursive: true });

const results = [];
function check(name, ok, extra = "") {
  results.push(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);
}

const browser = await chromium.launch();

// ── Desktop (user viewport ~1184x800) ──
const page = await browser.newPage({ viewport: { width: 1184, height: 800 } });
await page.goto(`${BASE}/page/1`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".reader-typography-trigger", { timeout: 15000 });

await page.click(".reader-typography-trigger");
await page.waitForSelector(".reader-typography-panel--open", { timeout: 3000 });

const panel = page.locator("#reader-toolbar-typography-panel");
const pr = await panel.boundingBox();
check("panel visible on desktop", pr && pr.width > 200 && pr.height > 60, JSON.stringify(pr));

// Paint order: the point at the panel centre must resolve to the panel, not the page card.
const hit = await page.evaluate(([x, y]) => {
  const el = document.elementFromPoint(x, y);
  return el ? { tag: el.tagName, cls: el.className?.toString?.().slice(0, 60) ?? "", inPanel: Boolean(el.closest("#reader-toolbar-typography-panel")) } : null;
}, [pr.x + pr.width / 2, pr.y + pr.height / 2]);
check("panel paints above page card", hit?.inPanel === true, JSON.stringify(hit));

// Hit test over the lower half of the panel (where the page card sits behind).
const hitLow = await page.evaluate(([x, y]) => {
  const el = document.elementFromPoint(x, y);
  return Boolean(el?.closest("#reader-toolbar-typography-panel"));
}, [pr.x + pr.width / 2, pr.y + pr.height - 8]);
check("panel bottom edge still above page", hitLow === true, String(hitLow));

// Stacked layout: font group row above size group row.
const fontBox = await page.locator(".reader-typography-panel .afc-font-group").boundingBox();
const sizeBox = await page.locator(".reader-typography-panel .afc-size-group").boundingBox();
check("controls stacked vertically", fontBox.y + fontBox.height <= sizeBox.y + 1, `font=${JSON.stringify(fontBox)} size=${JSON.stringify(sizeBox)}`);

// Native tooltip chips removed.
const titles = await page.$$eval(".afc-size-btn", (els) => els.map((e) => e.getAttribute("title")));
check("no native A-/A+ titles", titles.every((t) => t === null), JSON.stringify(titles));

// Panel stays inside the viewport.
check("panel inside viewport", pr.x >= 0 && pr.x + pr.width <= 1184, JSON.stringify(pr));

// Screenshot with panel open.
const deck = await page.locator(".reader-control-deck").boundingBox();
await page.screenshot({
  path: `${OUT}/typo-panel-desktop-open.png`,
  clip: { x: deck.x, y: deck.y, width: deck.width, height: Math.min(deck.height + 260, 800 - deck.y) },
});

// Close on outside click.
await page.mouse.click(200, 700);
await page.waitForTimeout(200);
check("outside click closes panel", (await page.locator(".reader-typography-panel--open").count()) === 0);

// Reopen + Escape closes and restores focus.
await page.click(".reader-typography-trigger");
await page.waitForSelector(".reader-typography-panel--open");
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
check("Escape closes panel", (await page.locator(".reader-typography-panel--open").count()) === 0);
const focused = await page.evaluate(() => document.activeElement?.className?.toString?.().slice(0, 40) ?? "");
check("Escape restores focus to trigger", focused.includes("reader-typography-trigger"), focused);

// Regression: deck still sits below header/player layers (sanity on computed z).
const deckZ = await page.evaluate(() => getComputedStyle(document.querySelector(".reader-control-deck")).zIndex);
check("deck z-index raised", deckZ === "40", deckZ);
await page.close();

// ── Mobile (393x852, bottom sheet) ──
const m = await browser.newPage({ viewport: { width: 393, height: 852 } });
await m.goto(`${BASE}/page/1`, { waitUntil: "domcontentloaded" });
await m.waitForSelector(".reader-typography-trigger", { timeout: 15000 });
await m.click(".reader-typography-trigger");
await m.waitForSelector(".reader-typography-panel--open", { timeout: 3000 });
const mpr = await m.locator("#reader-toolbar-typography-panel").boundingBox();
const mHit = await m.evaluate(([x, y]) => {
  const el = document.elementFromPoint(x, y);
  return Boolean(el?.closest("#reader-toolbar-typography-panel"));
}, [mpr.x + mpr.width / 2, mpr.y + mpr.height / 2]);
check("mobile sheet paints above page", mHit === true, JSON.stringify(mpr));
await m.screenshot({ path: `${OUT}/typo-panel-mobile-open.png` });
await m.close();

await browser.close();
console.log(results.join("\n"));
console.log(results.every((r) => r.startsWith("PASS")) ? "ALL PASS" : "SOME FAIL");
