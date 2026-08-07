import { test, expect } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

async function openReader(page) {
  await page.goto("/surah/1");
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({
    timeout: 30_000,
  });
}

async function patchAudioPlay(page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      localStorage.setItem("mushaf-plus-settings", JSON.stringify({
        skipSplashAnimation: true,
        showHome: false,
        showDuas: false,
        sidebarOpen: false,
        displayMode: "surah",
        mushafLayout: "list",
        lang: "fr",
        riwaya: "hafs",
        lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
      }));
    } catch {}
    const originalPlay = HTMLMediaElement.prototype.play;
    window.__audioPlayCalls = 0;
    HTMLMediaElement.prototype.play = function patchedPlay() {
      window.__audioPlayCalls += 1;
      return Promise.reject(new DOMException("blocked", "NotAllowedError"));
    };
    window.__restorePlay = () => {
      HTMLMediaElement.prototype.play = originalPlay;
    };
  });
}

test("E2E: clic verset n'active pas l'audio, bouton play explicite oui", async ({
  page,
}) => {
  await patchAudioPlay(page);
  await openReader(page);

  await page.evaluate(() => {
    window.__audioPlayCalls = 0;
  });

  await page.locator(".qc-ayah-text-ar").first().click();

  await expect
    .poll(async () => page.evaluate(() => Number(window.__audioPlayCalls || 0)))
    .toBe(0);

  const explicitPlay = page.locator(".srh-play-btn").first();
  await expect(explicitPlay).toBeVisible();
  await explicitPlay.click();

  await expect
    .poll(async () => page.evaluate(() => Number(window.__audioPlayCalls || 0)))
    .toBeGreaterThan(0);

  await page.evaluate(() => {
    window.__restorePlay?.();
  });
});

test("E2E: la lecture Warsh en vue Mushaf conserve un seul marqueur d'ayah", async ({
  page,
}) => {
  await installQuranNetworkFixtures(page);
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: false,
        showDuas: false,
        sidebarOpen: false,
        displayMode: "surah",
        mushafLayout: "mushaf",
        lang: "fr",
        riwaya: "warsh",
        fontFamily: "kfgqpc-warsh",
        fontFamilyByRiwaya: {
          hafs: "qpc-hafs",
          warsh: "kfgqpc-warsh",
        },
        showTranslation: false,
        showWordByWord: false,
        lastPosition: { surah: 3, ayah: 5, page: 50, juz: 3 },
      }),
    );

    HTMLMediaElement.prototype.play = function patchedPlay() {
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    };
  });

  await page.goto("/surah/3/5");
  await expect(page.locator(".cpv-verse").first()).toBeVisible({
    timeout: 30_000,
  });

  // Immersive reading intentionally hides the chrome after navigation. A
  // pointer movement is the desktop gesture that reveals the audio dock.
  await page.mouse.move(24, 24);
  await expect(page.locator(".mp-player-play-btn")).toBeInViewport();
  await page.locator(".mp-player-play-btn").evaluate((button) => button.click());

  const playingVerse = page.locator(".cpv-verse--playing").first();
  await expect(playingVerse).toBeVisible();
  await expect(playingVerse.locator(".native-ayah-marker")).toHaveCount(1);
  await expect(playingVerse.locator(".cpv-ayah-marker")).toHaveCount(1);
  await expect(
    playingVerse.locator(".warsh-karaoke-ayah-marker"),
  ).toHaveCount(0);
});
