import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

// The Arabic interface lays text out right-to-left. A French or English
// translation inside it is Latin script: left-to-right, tagged with its own
// language. Left inheriting the page direction, its final full stop landed at
// the wrong end of the line and a screen reader read it with an Arabic voice.

function seedArabic() {
  if (window.sessionStorage.getItem("mushafplus-e2e-seeded") === "1") return;
  window.sessionStorage.setItem("mushafplus-e2e-seeded", "1");
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const at = (delta) => {
    const total = (((minutes + delta) % 1440) + 1440) % 1440;
    return {
      hhmm: `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`,
      minutes: total,
    };
  };
  window.localStorage.setItem(
    "mushaf-plus-prayer-timings",
    JSON.stringify({
      timings: { Fajr: at(-180), Sunrise: at(-150), Dhuhr: at(-60), Asr: at(45), Maghrib: at(150), Isha: at(210) },
      hijri: "12 Rabi' al-Awwal 1448",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      methodName: "UOIF",
      latitude: 48.85,
      longitude: 2.35,
      method: 12,
      fetchedAt: Date.now(),
      dayKey: `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`,
    }),
  );
  window.localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({
      skipSplashAnimation: true,
      lang: "ar",
      theme: "light",
      riwaya: "hafs",
      prayerTimesEnabled: true,
      prayerMethod: 12,
      prayerLocation: { latitude: 48.85, longitude: 2.35, label: "Paris" },
    }),
  );
}

test.beforeEach(async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.addInitScript(seedArabic);
});

async function expectLatinLeftToRight(locator, lang) {
  await expect(locator).toHaveAttribute("dir", "ltr");
  if (lang) await expect(locator).toHaveAttribute("lang", lang);
  await expect(locator).toHaveCSS("direction", "ltr");
}

test("duas: the English translation and the transliteration read left-to-right on the Arabic page", async ({ page }) => {
  await page.goto("/duas");
  const translation = page.locator(".dua-translation").first();
  await expect(translation).toBeVisible({ timeout: 30_000 });
  await expectLatinLeftToRight(translation, "en");
  await expectLatinLeftToRight(page.locator(".dua-translit").first());
  // The Arabic text itself keeps the page direction.
  await expect(page.locator(".dua-arabic").first()).toHaveCSS("direction", "rtl");
});

test("prayers: the post-adhan translation is left-to-right, its Arabic note stays right-to-left", async ({ page }) => {
  await page.goto("/prieres");
  const translation = page.locator(".prayers-dua-translation__text").first();
  await expect(translation).toBeVisible({ timeout: 30_000 });
  await expectLatinLeftToRight(translation, "en");
  await expectLatinLeftToRight(page.locator(".prayers-dua-translit").first());
  await expect(page.locator(".prayers-dua-lang-note").first()).toHaveCSS("direction", "rtl");
});
