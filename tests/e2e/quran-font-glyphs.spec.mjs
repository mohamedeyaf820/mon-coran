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

test("Hafs pages keep an intact Unicode face when the page font is selected", async ({ page }) => {
  await openFullscreenPageReader(page, { fontFamily: "qpc-madani-page", showTajwid: true });
  const overlay = page.locator(".mfp-portal-root");
  const firstWord = overlay.locator(".qcm-word").first();

  await expect
    .poll(() => firstWord.evaluate((element) => window.getComputedStyle(element).fontFamily))
    .toContain("QPC Hafs", { timeout: 20_000 });

  await expect(firstWord).not.toHaveText("");
  expect(await overlay.locator(".qcm-word").count()).toBeGreaterThan(50);
  expect(await overlay.locator(".qcm-word").evaluateAll((words) =>
    words.some((word) => /[\u25CC\u25CF\u25CB\u2B24\u2022]/u.test(word.textContent || "")))).toBe(false);
  await expect(overlay.locator('.qcm-font-warning[data-tone="error"]')).toHaveCount(0);
});

test("blocking QCF page fonts leaves the Unicode reading text intact", async ({ page }) => {
  let pageFontRequests = 0;
  await page.route(/verses\.quran\.foundation\/fonts\//, (route) => {
    pageFontRequests += 1;
    return route.abort();
  });
  await openFullscreenPageReader(page, { fontFamily: "qpc-madani-page" });
  const overlay = page.locator(".mfp-portal-root");

  await expect(overlay.locator(".qcm-font-warning")).toHaveCount(0);
  const words = await overlay.locator(".qcm-word").evaluateAll((nodes) => nodes.slice(0, 8).map((node) => ({
    fontFamily: window.getComputedStyle(node).fontFamily,
    text: node.textContent || "",
  })));
  expect(words.length).toBeGreaterThan(0);
  words.forEach((word) => {
    expect(word.fontFamily).toContain("QPC Hafs");
    expect(word.text).toMatch(/[\u0600-\u06FF]/u);
  });
  expect(pageFontRequests).toBe(0);
});
