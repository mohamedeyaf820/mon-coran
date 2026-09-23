import { expect, test } from "@playwright/test";

async function openSurah(page, { riwaya = "warsh", showTajwid = true, width = 319 } = {}) {
  await page.setViewportSize({ width, height: 590 });
  await page.addInitScript(({ riwaya, showTajwid }) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true,
      showHome: false,
      currentSurah: 2,
      displayMode: "surah",
      mushafLayout: "list",
      riwaya,
      showTajwid,
      lang: "fr",
    }));
  }, { riwaya, showTajwid });
  await page.goto("/surah/2");
  await expect(page.locator(".qc-verse-card .qc-ayah-text-ar").first()).toBeVisible({ timeout: 25_000 });
}

for (const showTajwid of [false, true]) {
  test(`Warsh verse text selects the verse without word audio, Tajweed ${showTajwid ? "on" : "off"}`, async ({ page }) => {
    await openSurah(page, { showTajwid });
    const text = page.locator(".qc-verse-card .qc-ayah-text-ar").first();
    const word = text.locator(".quran-word-item").first();
    await expect(word).toBeVisible();
    await expect(word).not.toHaveAttribute("role", "button");
    await expect(word).not.toHaveClass(/cursor-pointer/);
    await word.click();
    await expect(page.locator(".qc-verse-card").first()).toHaveClass(/is-active/);
  });
}

test("Hafs keeps word interaction", async ({ page }) => {
  await openSurah(page, { riwaya: "hafs" });
  const word = page.locator(".qc-verse-card .quran-word-item").first();
  await expect(word).toHaveAttribute("role", "button");
  await expect(word).toHaveClass(/cursor-pointer/);
});

test("Warsh Mushaf word selects its ayah", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    skipSplashAnimation: true,
    showHome: false,
    displayMode: "page",
    mushafLayout: "mushaf",
    currentPage: 565,
    riwaya: "warsh",
    showTajwid: true,
    lang: "fr",
  })));
  await page.goto("/page/565");
  const word = page.locator('[data-stream-page="565"] .qcm-word').first();
  await expect(word).toBeVisible({ timeout: 25_000 });
  await word.click();
  await expect(word).toHaveClass(/qcm-word--active/);
});

test("compact header keeps both surah arrows and navigation", async ({ page }) => {
  await openSurah(page, { riwaya: "hafs" });
  const arrows = page.locator(".mp-header__nav-arrow");
  await expect(arrows).toHaveCount(2);
  for (const arrow of await arrows.all()) {
    await expect(arrow).toBeVisible();
    const box = await arrow.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await arrows.first().click();
  await expect(page).toHaveURL(/\/surah\/1(?:$|\?)/);
});

test("surah name size ignores Quran text size and info stays flat", async ({ page }) => {
  await openSurah(page, { riwaya: "hafs" });
  const name = page.locator(".srh-mobile-bar__name .font-surah-names");
  const initialSize = await name.evaluate((element) => getComputedStyle(element).fontSize);
  await page.locator(".app-root").evaluate((element) => element.style.setProperty("--quran-font-size", "64px"));
  await expect.poll(() => name.evaluate((element) => getComputedStyle(element).fontSize)).toBe(initialSize);

  await page.route("**/chapters/2/info?language=en", (route) => route.fulfill({
    json: { chapter_info: { text: "Name\n\nComplete editorial text.", source: "Quran.com" } },
  }));
  await page.locator(".srh-mobile-bar .srh-info-btn").last().click();
  const modal = page.locator(".surah-info-modal");
  await expect(modal).toBeVisible();
  await expect(modal.locator(".sip-dossier__copy")).toContainText("Complete editorial text.");
  const background = await modal.locator(".sip-header").evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(background).toBe("none");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(319);
});
