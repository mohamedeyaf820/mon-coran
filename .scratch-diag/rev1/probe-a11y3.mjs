import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));

await page.goto(BASE + "/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 15; i++) {
  if (await page.evaluate(() => !!document.querySelector("[data-ayah-number], .qc-list-card, .mushaf-book"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(2000);

const readSurah = () => page.evaluate(() => document.querySelector("header h1, header h2, .mp-header__title")?.textContent?.trim() ?? null);
const drawerUp = () => page.evaluate(() => !!document.querySelector(".settings-drawer"));

async function openSettings() {
  if (await drawerUp()) return true;
  await page.click('header button[aria-label="Plus d\'options"]');
  await page.waitForTimeout(700);
  const items = await page.evaluate(() => [...document.querySelectorAll("[role='menuitem'], [role='menuitemradio']")].map((m) => m.textContent.trim()));
  log("menu items:", JSON.stringify(items));
  const clicked = await page.evaluate(() => {
    const m = [...document.querySelectorAll("[role='menuitem'], [role='menuitemradio'], button")].find((x) => x.offsetParent && /réglages?|paramètres?/i.test(x.textContent || ""));
    if (!m) return null;
    m.setAttribute("data-probe-item", "1");
    return m.textContent.trim();
  });
  if (!clicked) return false;
  await page.click("[data-probe-item]");
  await page.waitForTimeout(1200);
  return drawerUp();
}

log("surah:", await readSurah());
log("opened:", await openSettings(), "drawer:", await drawerUp());

const t0 = await readSurah();
await page.keyboard.press("ArrowLeft");
await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(1200);
const t1 = await readSurah();
log("arrows behind settings:", t0 === t1 ? "BLOCKED" : `LEAKED ${t0} -> ${t1}`, "| drawer still open:", await drawerUp());

await page.keyboard.press("Escape");
await page.waitForTimeout(500);
const justAfter = await drawerUp();
await page.waitForTimeout(1800);
log("escape: closed then?", justAfter, "->", await drawerUp(), "| surah", await readSurah());

// focus ring on a switch via real Tab navigation
await openSettings();
const ringInfo = await page.evaluate(() => {
  const row = document.querySelector(".settings-control-row");
  if (!row) return "no row";
  row.scrollIntoView({ block: "center" });
  const prev = [...document.querySelectorAll(".settings-drawer button, .settings-drawer input, .settings-drawer a, .settings-drawer [tabindex]")]
    .filter((el) => el !== row.querySelector("input") && el.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING);
  prev.at(-1)?.focus();
  return prev.length;
});
await page.keyboard.press("Tab");
await page.waitForTimeout(400);
log("focus ring:", await page.evaluate(() => {
  const el = document.activeElement;
  const row = el?.closest?.(".settings-control-row");
  if (!row) return `active=${el?.tagName}#${el?.id}.${String(el?.className).slice(0, 40)}`;
  const cs = getComputedStyle(row.querySelector(".settings-switch"));
  return `tag=${el.tagName}#${el.id} focusVisible=${el.matches(":focus-visible")} outline=${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`;
}));
await page.screenshot({ path: ".scratch-diag/rev1/switch-focus.png", clip: await page.evaluate(() => {
  const r = document.querySelector(".settings-control-row").getBoundingClientRect();
  return { x: Math.max(0, r.x - 6), y: Math.max(0, r.y - 6), width: Math.min(r.width + 12, 1000), height: r.height + 12 };
}) }).catch((e) => log("shot failed:", e.message.split("\n")[0]));

await browser.close();
