import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const out = [];
const log = (...a) => { out.push(a.join(" ")); console.log(...a); };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));

await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 12; i++) {
  const ready = await page.evaluate(() => !!document.querySelector(".app-main, main"));
  if (ready) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(3000);

const titleSel = ".mp-header__title, header h1, header [class*='title']";
const readTitle = () => page.evaluate((sel) => document.querySelector(sel)?.textContent?.trim() ?? null, titleSel);

log("title before:", await readTitle());

// Open the settings panel the way a user does.
const opener = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button")];
  const b = btns.find((x) => /réglage|paramètre|settings|setting/i.test(x.getAttribute("aria-label") || "") || /réglage|paramètre|settings/i.test(x.title || ""));
  if (b) { b.setAttribute("data-probe-settings", "1"); return b.getAttribute("aria-label") || b.title; }
  return null;
});
log("settings opener:", opener);
if (!opener) { log("NO OPENER — buttons:", await page.evaluate(() => [...document.querySelectorAll("header button")].map(b => b.getAttribute("aria-label")).join("|"))); }
else {
  await page.click("button[data-probe-settings]");
  await page.waitForTimeout(1200);
}

const drawerOpen = await page.evaluate(() => !!document.querySelector(".settings-drawer"));
log("drawer open:", drawerOpen);

// 1. Arrow keys must not navigate behind the open settings panel.
const before = await readTitle();
await page.evaluate(() => document.querySelector(".settings-drawer").blur?.());
await page.keyboard.press("ArrowLeft");
await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(900);
const after = await readTitle();
log("arrows behind settings:", before === after ? "BLOCKED (ok)" : `LEAKED ${before} -> ${after}`);

// 2. One Escape closes it and does not reopen it.
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
log("drawer right after Escape:", await page.evaluate(() => !!document.querySelector(".settings-drawer")));
await page.waitForTimeout(1200);
log("drawer 1.2s after Escape:", await page.evaluate(() => !!document.querySelector(".settings-drawer")));

// 3. Focus ring on a switch.
await page.click("button[data-probe-settings]");
await page.waitForTimeout(900);
const ring = await page.evaluate(() => {
  const input = document.querySelector(".settings-control-row input.settings-visually-hidden");
  if (!input) return "no switch input found";
  input.focus();
  const track = input.closest(".settings-control-row").querySelector(".settings-switch");
  const cs = getComputedStyle(track);
  const focused = document.activeElement === input;
  // :focus-visible needs a keyboard-like focus; report both.
  return { focused, outline: cs.outline, outlineWidth: cs.outlineWidth, matchesHas: input.matches(":focus-visible") };
});
log("switch focus:", JSON.stringify(ring));
await page.screenshot({ path: ".scratch-diag/rev1/switch-focus.png", clip: await page.evaluate(() => {
  const input = document.querySelector(".settings-control-row input.settings-visually-hidden");
  const r = input.closest(".settings-control-row").getBoundingClientRect();
  return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: r.width + 16, height: r.height + 16 };
}) });

// Keyboard real focus: Tab from the first control.
const tabRing = await page.evaluate(() => {
  const rows = [...document.querySelectorAll(".settings-control-row")];
  if (!rows.length) return "none";
  const first = rows[0].querySelector("input");
  first.focus();
  return rows.length;
});
await page.keyboard.press("Shift+Tab");
await page.keyboard.press("Tab");
await page.waitForTimeout(200);
log("after Tab, focus ring:", await page.evaluate(() => {
  const el = document.activeElement;
  const row = el?.closest?.(".settings-control-row");
  if (!row) return `active=${el?.tagName}.${el?.className}`;
  const cs = getComputedStyle(row.querySelector(".settings-switch"));
  return `row focus outline=${cs.outlineWidth} ${cs.outlineStyle} matchesFV=${el.matches(":focus-visible")}`;
}));

await browser.close();
