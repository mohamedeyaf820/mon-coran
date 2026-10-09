import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

// The translation is requested from AlQuran Cloud (edition fr.hamidullah /
// en.sahih) and from Quran.com (resource 136 French, 20 English); the
// requests are the proof of which one the reader will see.
const FRENCH = /fr\.hamidullah|translations=136(?!\d)/;
const ENGLISH = /en\.sahih|translations=20(?!\d)/;

async function translationResourcesRequested(page, path, preset) {
  const urls = [];
  page.on("request", (request) => {
    const url = decodeURIComponent(request.url());
    if (/api\.alquran\.cloud\/v1\/surah\/\d+\/|api\.quran\.com.*translations=/.test(url)) urls.push(url);
  });
  await installQuranNetworkFixtures(page);
  if (preset) {
    await page.addInitScript((value) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(value)), preset);
  }
  await page.goto(path);
  await expect(page.locator(".qc-ayah-text-ar, .cpv-verse").first()).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => urls.length, { timeout: 15_000 }).toBeGreaterThan(0);
  return urls.join(" ");
}

test("a first visit on an English address reads the English translation", async ({ page }) => {
  const requested = await translationResourcesRequested(page, "/en/surah/2");
  expect(requested).toMatch(ENGLISH);
  expect(requested).not.toMatch(FRENCH);
});

test("a first visit on a French address keeps the French translation", async ({ page }) => {
  const requested = await translationResourcesRequested(page, "/surah/2");
  expect(requested).toMatch(FRENCH);
  expect(requested).not.toMatch(ENGLISH);
});

test("a returning reader keeps the translation they saved, whatever the address language", async ({ page }) => {
  const requested = await translationResourcesRequested(page, "/en/surah/2", {
    lang: "fr",
    translationLang: "fr",
    translationLangs: ["fr"],
    riwaya: "hafs",
    skipSplashAnimation: true,
  });
  expect(requested).toMatch(FRENCH);
  expect(requested).not.toMatch(ENGLISH);
});
