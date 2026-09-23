import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4173";

async function openPage(browser, { layout, displayMode, showTranslation }) {
  const context = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.addInitScript(
    ([l, d, t]) => {
      localStorage.setItem("mushaf-plus-settings", JSON.stringify({
        skipSplashAnimation: true, showHome: false, showDuas: false, sidebarOpen: false,
        displayMode: d, mushafLayout: l, lang: "fr", riwaya: "hafs",
        fontFamily: "qpc-hafs", fontFamilyByRiwaya: { hafs: "qpc-hafs", warsh: "qpc-warsh" },
        showTranslation: t, showTransliteration: false, showTajwid: false,
        currentSurah: 1, currentPage: 1, currentJuz: 1,
        lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
      }));
    },
    [layout, displayMode, showTranslation],
  );
  return { context, page };
}

const browser = await chromium.launch();
const results = [];
const check = (name, ok, detail = "") => results.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);

// 1. Mushaf page mode, showTranslation=true -> no translation band, button disabled with hint
{
  const { context, page } = await openPage(browser, { layout: "mushaf", displayMode: "page", showTranslation: true });
  await page.goto(`${BASE}/page/1`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".quran-display--platform", { timeout: 45000 });
  await page.waitForTimeout(2500);
  const btn = page.locator(".reader-toolbar-btn--translation").first();
  const btnCount = await page.locator(".reader-toolbar-btn--translation").count();
  if (btnCount > 0) {
    check("mushaf: toolbar translation button visible", true);
    check("mushaf: button disabled", await btn.isDisabled());
    const title = await btn.getAttribute("title");
    check("mushaf: hint in title", Boolean(title && title.includes("Mushaf")), title || "");
  } else {
    // Page mode may not surface ReadingToolbar; record what we see
    check("mushaf: toolbar translation button visible", false, "count 0");
  }
  const band = await page.locator(".cpv-translation-panel, .cpv-translation-row, .qc-list-card__translation-slot").count();
  check("mushaf page: no translation DOM in page pane", band === 0, `count=${band}`);
  // cpv-surah-name-ligature spans carry lang="fr" but render the Arabic
  // calligraphy header, not translation text.
  const anyFr = await page.locator('.quran-mode-pane--mushaf [lang="fr"]:not(.cpv-surah-name-ligature), .quran-mode-pane--mushaf [lang="en"]:not(.cpv-surah-name-ligature)').count();
  check("mushaf page: no fr/en text nodes in mushaf pane", anyFr === 0, `count=${anyFr}`);
  await page.screenshot({ path: ".scratch-diag/captures/mushaf-off-trans-true.png" });
  await context.close();
}

// 2. "T" shortcut no-op in mushaf (showTranslation=false, press t, stays false)
{
  const { context, page } = await openPage(browser, { layout: "mushaf", displayMode: "page", showTranslation: false });
  await page.goto(`${BASE}/page/1`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".quran-display--platform", { timeout: 45000 });
  await page.waitForTimeout(2000);
  const btnCount = await page.locator(".reader-toolbar-btn--translation").count();
  if (btnCount > 0) {
    const before = await page.locator(".reader-toolbar-btn--translation").first().getAttribute("aria-pressed");
    await page.keyboard.press("t");
    await page.waitForTimeout(600);
    const after = await page.locator(".reader-toolbar-btn--translation").first().getAttribute("aria-pressed");
    check("mushaf: T key no-op", before === "false" && after === "false", `before=${before} after=${after}`);
  } else {
    check("mushaf: T key no-op", false, "no button to inspect");
  }
  await context.close();
}

// 3. List page mode, showTranslation=true -> translations rendered, button enabled
{
  const { context, page } = await openPage(browser, { layout: "list", displayMode: "page", showTranslation: true });
  await page.goto(`${BASE}/page/1`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".quran-display--platform", { timeout: 45000 });
  await page.waitForTimeout(3000);
  const slots = page.locator(".qc-list-card__translation-slot");
  const n = await slots.count();
  check("list: translation slots present", n > 0, `count=${n}`);
  let texts = 0;
  for (let i = 0; i < Math.min(n, 8); i++) {
    const t = (await slots.nth(i).innerText()).trim();
    if (t.length > 0) texts++;
  }
  check("list: translation slots have text", texts > 0, `filled=${texts}`);
  const btnCount = await page.locator(".reader-toolbar-btn--translation").count();
  if (btnCount > 0) {
    const btn = page.locator(".reader-toolbar-btn--translation").first();
    check("list: button enabled", !(await btn.isDisabled()));
    const before = await btn.getAttribute("aria-pressed");
    await page.keyboard.press("t");
    await page.waitForTimeout(600);
    const after = await btn.getAttribute("aria-pressed");
    check("list: T key still toggles", before === "true" && after === "false", `before=${before} after=${after}`);
  }
  await page.screenshot({ path: ".scratch-diag/captures/list-trans-on.png" });
  await context.close();
}

// 4. Surah mode mushaf layout -> header translation toggle disabled with hint
{
  const { context, page } = await openPage(browser, { layout: "mushaf", displayMode: "surah", showTranslation: true });
  await page.goto(`${BASE}/surah/1`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".srh-root", { timeout: 45000 });
  await page.waitForTimeout(2500);
  const tgl = page.locator('.srh-toggle:has-text("Traduction")').first();
  const cnt = await page.locator('.srh-toggle:has-text("Traduction")').count();
  if (cnt > 0) {
    check("surah mushaf: header translation toggle disabled", await tgl.isDisabled());
    const title = await tgl.getAttribute("title");
    check("surah mushaf: header hint title", Boolean(title && title.includes("Mushaf")), title || "");
  } else {
    check("surah mushaf: header translation toggle found", false, `count=${cnt}`);
  }
  const band = await page.locator(".cpv-translation-panel, .cpv-translation-row").count();
  check("surah mushaf: no translation band in page", band === 0, `count=${band}`);
  await page.screenshot({ path: ".scratch-diag/captures/surah-mushaf-header.png" });
  await context.close();
}

// 5. Surah mode list layout -> header translation toggle enabled
{
  const { context, page } = await openPage(browser, { layout: "list", displayMode: "surah", showTranslation: true });
  await page.goto(`${BASE}/surah/1`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".srh-root", { timeout: 45000 });
  await page.waitForTimeout(2500);
  const tgl = page.locator('.srh-toggle:has-text("Traduction")').first();
  if (await tgl.count() > 0) {
    check("surah list: header translation toggle enabled", !(await tgl.isDisabled()));
  } else {
    check("surah list: header translation toggle found", false);
  }
  await context.close();
}

console.log(results.join("\n"));
await browser.close();
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
