import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));

await page.evaluate(() => localStorage.clear());
await page.goto(BASE + "/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 15; i++) {
  const ready = await page.evaluate(() => !!document.querySelector("[data-ayah-number], .qc-list-card, .mushaf-book"));
  if (ready) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(2000);

const headerButtons = () => page.evaluate(() => [...document.querySelectorAll("header button, .app-header button")].map((b) => b.getAttribute("aria-label") || b.textContent.trim().slice(0, 20)));
log("header buttons:", JSON.stringify(await headerButtons()));

const readSurah = () => page.evaluate(() => {
  const h = document.querySelector("header h1, header h2, .mp-header__title, [class*='surah-title']");
  return h?.textContent?.trim() || null;
});
log("surah label:", await readSurah());

async function openSettings() {
  const ok = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => /réglage|setting/i.test((x.getAttribute("aria-label") || "") + (x.title || "")));
    if (!b) return false;
    b.setAttribute("data-probe", "1");
    return true;
  });
  if (!ok) return false;
  await page.click("button[data-probe]");
  await page.waitForTimeout(1000);
  return page.evaluate(() => !!document.querySelector(".settings-drawer"));
}

log("settings opened:", await openSettings());

const before = await readSurah();
await page.keyboard.press("Escape");
await page.waitForTimeout(600);
log("after 1 Escape, drawer:", await page.evaluate(() => !!document.querySelector(".settings-drawer")));
await page.waitForTimeout(1500);
log("1.5s later, drawer:", await page.evaluate(() => !!document.querySelector(".settings-drawer")), "(title", await readSurah(), ")");

// arrows must not leak to the reader while settings is open
await openSettings();
const t0 = await readSurah();
await page.keyboard.press("ArrowLeft");
await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(1000);
const t1 = await readSurah();
log("arrow behind settings:", t0 === t1 ? "BLOCKED" : `LEAKED ${t0} -> ${t1}`);
const drawerAfterArrows = await page.evaluate(() => !!document.querySelector(".settings-drawer"));
log("drawer still open:", drawerAfterArrows);

// focus ring on a switch, driven by a real Tab
await page.evaluate(() => {
  const row = document.querySelector(".settings-control-row");
  row?.scrollIntoView({ block: "center" });
  const prev = row?.previousElementSibling?.querySelector("button, input, select, a") || row?.parentElement?.querySelector("button, input, select, a");
  prev?.focus();
});
await page.keyboard.press("Tab");
await page.waitForTimeout(300);
log("focus ring:", await page.evaluate(() => {
  const el = document.activeElement;
  const row = el?.closest?.(".settings-control-row");
  if (!row) return `active=${el?.tagName}#${el?.id} .${el?.className}`;
  const cs = getComputedStyle(row.querySelector(".settings-switch"));
  return `input focused=${el.matches(":focus-visible")} outline=${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`;
}));
await page.screenshot({ path: ".scratch-diag/rev1/switch-focus.png", clip: await page.evaluate(() => {
  const row = document.querySelector(".settings-control-row");
  const r = row.getBoundingClientRect();
  return { x: Math.max(0, r.x - 6), y: Math.max(0, r.y - 6), width: Math.min(r.width + 12, 900), height: r.height + 12 };
}) }).catch((e) => log("shot failed", e.message));

await browser.close();
