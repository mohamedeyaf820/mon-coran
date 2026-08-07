import { test, expect } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

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
            skipSplashAnimation: true,
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
      ".search-pro-overlay",
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
  await installQuranNetworkFixtures(page);
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

  const mushafFlow = await page.locator(".mushaf-text-block").first().evaluate((element) => {
    const blockStyle = window.getComputedStyle(element);
    const verseStyle = window.getComputedStyle(
      element.querySelector(".quran-verse-inline"),
    );
    return {
      lineHeightRatio:
        Number.parseFloat(blockStyle.lineHeight) /
        Number.parseFloat(blockStyle.fontSize),
      textAlignLast: blockStyle.textAlignLast,
      verseDisplay: verseStyle.display,
    };
  });
  expect(mushafFlow.verseDisplay).toBe("inline");
  expect(mushafFlow.lineHeightRatio).toBeGreaterThanOrEqual(1.85);
  expect(mushafFlow.lineHeightRatio).toBeLessThanOrEqual(2.1);
  expect(mushafFlow.textAlignLast).not.toBe("center");
});

test("continuous Mushaf markers preserve a clear gap before the following ayah", async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await seedReader(page, { mushafLayout: "mushaf" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/surah/3");
  await waitForReader(page);

  const markers = page.locator(".cpv-ayah-marker");
  expect(await markers.count()).toBeGreaterThan(1);
  const markerSpacing = await markers.first().evaluate((element) => {
    const style = window.getComputedStyle(element);
    const parentStyle = window.getComputedStyle(element.parentElement);
    const fontSize =
      Number.parseFloat(style.fontSize) || Number.parseFloat(parentStyle.fontSize) || 1;
    return {
      inlineStart:
        Number.parseFloat(style.getPropertyValue("margin-inline-start") || "0") /
        fontSize,
      inlineEnd:
        Number.parseFloat(style.getPropertyValue("margin-inline-end") || "0") /
        fontSize,
    };
  });
  const ownAyahGap = Math.min(markerSpacing.inlineStart, markerSpacing.inlineEnd);
  const nextAyahGap = Math.max(markerSpacing.inlineStart, markerSpacing.inlineEnd);
  expect(ownAyahGap).toBeLessThanOrEqual(0.2);
  expect(nextAyahGap).toBeGreaterThanOrEqual(0.68);
});

test("reading page stays usable after riwaya refresh and browser history navigation", async ({ page }) => {
  await installQuranNetworkFixtures(page);
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

test("cold Hafs reading keeps study actions usable without speculative audio or Warsh requests", async ({
  page,
}) => {
  await installQuranNetworkFixtures(page);
  await seedReader(page, {
    showTranslation: false,
    riwaya: "hafs",
    mushafLayout: "list",
    lastPosition: {
      surah: 1,
      ayah: 1,
      page: 1,
      juz: 1,
    },
  });
  await page.addInitScript(() => {
    window.__readerCumulativeLayoutShift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__readerCumulativeLayoutShift += entry.value;
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.setViewportSize({ width: 390, height: 844 });

  const requests = [];
  page.on("request", (request) => requests.push(request.url()));

  await page.goto("/surah/1", { waitUntil: "domcontentloaded" });
  await waitForReader(page);
  await page.waitForTimeout(1_000);

  const firstCard = page.locator(".qc-list-card").first();
  await expect(firstCard.locator(".ayah-action--play")).toHaveCount(1);
  await expect(firstCard.locator(".ayah-action--bookmark")).toHaveCount(1);
  await expect(firstCard.locator(".ayah-action--options")).toHaveCount(1);
  await expect(firstCard.locator(".qcom-list-study-links")).toHaveCount(0);

  const parsedRequests = requests.map((url) => new URL(url));
  expect(
    parsedRequests.filter((url) => url.pathname.includes("/recitations/")),
  ).toHaveLength(0);
  expect(
    parsedRequests.filter(
      (url) =>
        url.pathname.includes("/warsh_text/") ||
        url.pathname.endsWith("/warshData_v2-1.json"),
    ),
  ).toHaveLength(0);
  expect(
    await page.evaluate(() => window.__readerCumulativeLayoutShift || 0),
  ).toBeLessThan(0.1);
  await assertNoHorizontalOverflow(page);
});
