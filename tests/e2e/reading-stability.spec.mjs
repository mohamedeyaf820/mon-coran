import { test, expect } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";

async function seedReader(page, overrides = {}) {
  await page.addInitScript(
    ({ key, overrides }) => {
      try {
        const previous = JSON.parse(localStorage.getItem(key) || "{}");
        localStorage.setItem(
          key,
          JSON.stringify({
            ...previous,
            splashDone: true,
            showHome: false,
            showDuas: false,
            sidebarOpen: false,
            displayMode: "surah",
            mushafLayout: "mushaf",
            lang: "fr",
            riwaya: "hafs",
            fontFamily: "qpc-hafs",
            quranFontSize: 34,
            lastPosition: {
              surah: 3,
              ayah: 1,
              page: 50,
              juz: 3,
            },
            ...overrides,
          }),
        );
      } catch {
        // Ignore storage bootstrap failures; the assertions below will fail clearly.
      }
    },
    { key: SETTINGS_KEY, overrides },
  );
}

async function waitForReader(page) {
  await expect(page.locator(".quran-display--platform").first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({
    timeout: 30_000,
  });
}

async function getArabicFontSize(page) {
  return page.locator(".qc-ayah-text-ar").first().evaluate((element) => {
    return Number.parseFloat(window.getComputedStyle(element).fontSize || "0");
  });
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(0, root.scrollWidth - window.innerWidth);
  });
  expect(overflow).toBeLessThanOrEqual(2);
}

async function assertNoBlockingVeil(page) {
  const visibleBlockers = await page.evaluate(() => {
    const selectors = [
      ".settings-backdrop",
      ".audio-player-modal",
      ".sidebar-clickout-overlay",
      ".modal-overlay",
      ".search-modal-shell",
    ];

    return selectors.flatMap((selector) =>
      Array.from(document.querySelectorAll(selector))
        .filter((element) => {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            Number.parseFloat(style.opacity || "1") > 0.05 &&
            rect.width > window.innerWidth * 0.35 &&
            rect.height > window.innerHeight * 0.35
          );
        })
        .map((element) => ({
          selector,
          className: element.className,
        })),
    );
  });

  expect(visibleBlockers).toEqual([]);
}

test("reading refresh keeps mushaf visible without stale blur overlay", async ({ page }) => {
  await seedReader(page, { mushafLayout: "mushaf" });
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/surah/3");
  await waitForReader(page);

  const firstSize = await getArabicFontSize(page);
  expect(firstSize).toBeGreaterThanOrEqual(24);
  expect(firstSize).toBeLessThanOrEqual(72);

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForReader(page);

  await assertNoBlockingVeil(page);
  await assertNoHorizontalOverflow(page);

  const reloadedSize = await getArabicFontSize(page);
  expect(reloadedSize).toBeGreaterThanOrEqual(24);
  expect(reloadedSize).toBeLessThanOrEqual(72);
  expect(Math.abs(reloadedSize - firstSize)).toBeLessThanOrEqual(8);
});

test("reading page stays usable after riwaya refresh and browser history navigation", async ({ page }) => {
  await seedReader(page, {
    riwaya: "warsh",
    fontFamily: "qpc-warsh",
    mushafLayout: "list",
    lastPosition: {
      surah: 2,
      ayah: 25,
      page: 5,
      juz: 1,
    },
  });
  await page.setViewportSize({ width: 820, height: 920 });

  await page.goto("/surah/2/25");
  await waitForReader(page);
  await expect(page.locator(".quran-display--warsh").first()).toBeVisible();
  await assertNoHorizontalOverflow(page);

  const warshSize = await getArabicFontSize(page);
  expect(warshSize).toBeGreaterThanOrEqual(22);
  expect(warshSize).toBeLessThanOrEqual(72);

  await page.goto("/surah/3");
  await waitForReader(page);

  await page.goBack();
  await expect(page).toHaveURL(/\/surah\/2\/25$/);
  await waitForReader(page);
  await expect(page.locator(".quran-display--warsh").first()).toBeVisible();
  await assertNoBlockingVeil(page);
});
