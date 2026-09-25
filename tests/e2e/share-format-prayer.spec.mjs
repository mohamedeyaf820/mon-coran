import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

const SETTINGS_KEY = "mushaf-plus-settings";
const PRAYER_CACHE_KEY = "mushaf-plus-prayer-timings";

test("share format picker states ratio, platforms and a contextual hint", async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((settingsKey) => {
    window.localStorage.setItem(
      settingsKey,
      JSON.stringify({
        skipSplashAnimation: true,
        lang: "fr",
        theme: "dark",
        riwaya: "hafs",
        reciter: "ar.alafasy",
        showHome: false,
        displayMode: "surah",
        mushafLayout: "mushaf",
      }),
    );
  }, SETTINGS_KEY);

  await page.goto("/surah/8");
  const firstMarker = page.locator(".cpv-verse .native-ayah-marker").first();
  await expect(firstMarker).toBeVisible({ timeout: 20_000 });
  await firstMarker.click();

  const actionsDialog = page.locator(".ayah-actions-modal[role='dialog']");
  await actionsDialog.getByRole("button", { name: /Plus d.actions/ }).click();
  await page.getByRole("menuitem", { name: "Partager en image" }).click();

  const studio = page.getByRole("dialog", { name: "Partager le verset en image" });
  await expect(studio).toBeVisible();
  await expect(studio.locator(".share-studio__preview-frame img")).toBeVisible();

  // The surahnames face must be embedded in the exported SVG, and the header
  // must draw the ligature's code points with it instead of the Amiri surah line.
  const previewSvg = await studio
    .locator(".share-studio__preview-frame img")
    .evaluate((img) => decodeURIComponent(img.src.replace(/^data:image\/svg\+xml;charset=utf-8,/, "")));
  expect(previewSvg).toContain("font-family:'surahnames';src:url(data:font/woff2;base64,");
  expect(previewSvg).toMatch(
    /<text x="540" y="144" text-anchor="middle" font-family="'surahnames',serif" font-size="50" [^>]*>008<\/text>/,
  );
  await studio
    .locator(".share-studio__preview-frame")
    .screenshot({ path: "test-results/share-card-preview.png" });

  // The three tiles state their ratio up front, in declared order.
  const tiles = studio.locator(".share-format-picker button");
  await expect(tiles).toHaveCount(3);
  await expect(studio.locator(".share-format-ratio")).toHaveText(["1:1", "4:5", "9:16"]);
  await expect(studio.locator(".share-format-platforms").first()).toContainText("Instagram");
  const firstTileBox = await tiles.first().boundingBox();
  expect(firstTileBox?.height || 0).toBeGreaterThanOrEqual(44);

  // The hint below the picker follows the selection and names the platforms.
  const hint = studio.locator(".share-format-hint");
  await expect(hint).toContainText("Carré 1:1");
  await tiles.nth(2).click();
  await expect(hint).toContainText("9:16");
  await expect(hint).toContainText("WhatsApp");
  await expect(tiles.nth(2)).toHaveAttribute("aria-pressed", "true");

  await page.screenshot({ path: "test-results/share-format-mobile.png", fullPage: false });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "test-results/share-format-desktop.png", fullPage: false });
});

test("prayer modal leads with the next prayer and icons every row", async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(({ settingsKey, cacheKey }) => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const at = (delta) => {
      const total = (((nowMinutes + delta) % 1440) + 1440) % 1440;
      const hours = Math.floor(total / 60);
      const minutes = total % 60;
      return {
        hhmm: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
        minutes: total,
      };
    };
    // Fresh same-day cache at the seeded coordinates: the stale-while-revalidate
    // path answers instantly, so the modal renders its ready state offline.
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        timings: {
          Fajr: at(-180),
          Sunrise: at(-150),
          Dhuhr: at(-60),
          Asr: at(45),
          Maghrib: at(150),
          Isha: at(210),
        },
        hijri: "12 Rabi' al-Awwal 1448",
        timezone: "Europe/Paris",
        methodName: "UOIF",
        latitude: 48.85,
        longitude: 2.35,
        method: 12,
        fetchedAt: Date.now(),
        dayKey: `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`,
      }),
    );
    window.localStorage.setItem(
      settingsKey,
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: true,
        lang: "fr",
        theme: "dark",
        riwaya: "hafs",
        prayerTimesEnabled: true,
        prayerMethod: 12,
        prayerLocation: { latitude: 48.85, longitude: 2.35, label: "Paris" },
      }),
    );
  }, { settingsKey: SETTINGS_KEY, cacheKey: PRAYER_CACHE_KEY });

  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible();

  const strip = page.locator(".home-prayer-strip");
  await expect(strip).toBeVisible({ timeout: 20_000 });
  await strip.click();

  const modal = page.locator(".prayer-modal");
  await expect(modal).toBeVisible();

  // Hero: kicker, bilingual name, clock and a countdown in French.
  await expect(modal.locator(".prayer-modal__hero")).toBeVisible();
  await expect(modal.locator(".prayer-modal__hero-name")).not.toBeEmpty();
  await expect(modal.locator(".prayer-modal__hero-clock")).toHaveText(/^\d{2}:\d{2}$/);
  await expect(modal.locator(".prayer-modal__hero-countdown")).toContainText(/dans/);

  // Every displayed time has an icon and its Arabic twin; the current moment is
  // either a next-prayer row or the after-Isha note.
  await expect(modal.locator(".prayer-modal__row")).toHaveCount(6);
  await expect(modal.locator(".prayer-modal__row-icon svg")).toHaveCount(6);
  await expect(modal.locator(".prayer-modal__row-ar")).toHaveCount(6);
  const nextRow = modal.locator(".prayer-modal__row.is-next");
  const afterIsha = modal.locator(".prayer-modal__note");
  await expect(nextRow.or(afterIsha).first()).toBeVisible();

  await page.screenshot({ path: "test-results/prayer-modal-mobile.png", fullPage: false });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "test-results/prayer-modal-desktop.png", fullPage: false });
});
