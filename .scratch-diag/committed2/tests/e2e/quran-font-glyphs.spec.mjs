import { expect, test } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";

// These specs deliberately avoid the Quran.com fixtures: font loading must be
// exercised exactly as a reader experiences it, over the network.
async function openFullscreenPageReader(page, overrides = {}) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(({ key, overrides }) => {
    localStorage.setItem(key, JSON.stringify({
      skipSplashAnimation: true,
      showHome: false,
      showDuas: false,
      sidebarOpen: false,
      displayMode: "page",
      mushafLayout: "mushaf",
      lang: "fr",
      riwaya: "hafs",
      showTajwid: false,
      currentSurah: 2,
      currentPage: 3,
      currentJuz: 1,
      lastPosition: { surah: 2, ayah: 1, page: 3, juz: 1 },
      ...overrides,
    }));
  }, { key: SETTINGS_KEY, overrides });
  await page.goto(`/page/${overrides.currentPage || 3}`);
  await expect(page.locator(".quran-display--platform")).toBeVisible({ timeout: 30_000 });
  const trigger = page.locator(":is(.reader-fullscreen-trigger, .srh-fullscreen-btn):visible").first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.locator(".mfp-portal-root")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".mfp-portal-root .qcm-word").first()).toBeVisible({ timeout: 30_000 });
}

test("Hafs pages load their real QCF page font and render words with it", async ({ page }) => {
  await openFullscreenPageReader(page);
  const overlay = page.locator(".mfp-portal-root");
  const firstWord = overlay.locator(".qcm-word").first();

  await expect
    .poll(() => firstWord.evaluate((element) => window.getComputedStyle(element).fontFamily))
    .toContain("qcf-v2-p3", { timeout: 20_000 });

  const fontState = await page.evaluate(() => ({
    registered: [...document.fonts].some(
      (face) => face.family.includes("qcf-v2-p3") && face.status === "loaded",
    ),
    // document.fonts.check alone returns true for unknown families, so the
    // loaded FontFace above is the load-bearing assertion.
    available: document.fonts.check('16px "qcf-v2-p3"'),
  }));
  expect(fontState.registered, "the page font face is actually loaded").toBe(true);
  expect(fontState.available).toBe(true);

  await expect(firstWord).not.toHaveText("");
  await expect(overlay.locator(".qcm-font-warning")).toHaveCount(0);
});

test("a blocked QCF font keeps the Quran text readable through the fallback", async ({ page }) => {
  await page.route(/verses\.quran\.foundation\/fonts\//, (route) => route.abort());
  await openFullscreenPageReader(page);
  const overlay = page.locator(".mfp-portal-root");

  await expect(overlay.locator(".qcm-font-warning").first()).toBeVisible({ timeout: 30_000 });
  expect(await overlay.locator(".qcm-font-warning").count()).toBeGreaterThanOrEqual(1);
  const words = await overlay.locator(".qcm-word").evaluateAll((nodes) => nodes.slice(0, 8).map((node) => ({
    fontFamily: window.getComputedStyle(node).fontFamily,
    text: node.textContent || "",
  })));
  expect(words.length).toBeGreaterThan(0);
  words.forEach((word) => {
    expect(word.fontFamily).not.toContain("qcf-");
    expect(word.text).toMatch(/[\u0600-\u06FF]/u);
  });
});
