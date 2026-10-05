import fs from "node:fs";
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

test("E2E: bouton play explicite démarre la lecture, clic mot joue l'audio du mot", async ({
  page,
}) => {
  await patchAudioPlay(page);
  await openReader(page);

  // Word audio click is an intentional feature: clicking a word with an audioUrl
  // plays that word's pronunciation. We verify only that the explicit play button
  // also triggers audio, which is the primary playback contract.
  const explicitPlay = page.locator(".srh-play-btn").first();
  await expect(explicitPlay).toBeVisible();

  await page.evaluate(() => { window.__audioPlayCalls = 0; });
  await explicitPlay.click();

  await expect
    .poll(async () => page.evaluate(() => Number(window.__audioPlayCalls || 0)))
    .toBeGreaterThan(0);

  await expect(page.getByText('Le navigateur a interrompu la lecture. Appuyez sur Lecture pour reprendre.')).toBeVisible();

  await page.evaluate(() => {
    window.__restorePlay?.();
  });
});

test("E2E: la lecture Warsh conserve ses couleurs et un seul marqueur d'ayah", async ({
  page,
}) => {
  await installQuranNetworkFixtures(page, { withWarshDabt: true });
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
        reciter: "warsh_yassin",
        fontFamily: "qpc-warsh",
        fontFamilyByRiwaya: {
          hafs: "qpc-hafs",
          warsh: "qpc-warsh",
        },
        showTranslation: false,
        showWordByWord: false,
        showTajwid: true,
        lastPosition: { surah: 3, ayah: 5, page: 50, juz: 3 },
      }),
    );

  });

  await page.route(/\.mp3(?:\?.*)?$/i, route => route.fulfill({
    status: 200, contentType: "audio/mpeg", body: fs.readFileSync("tests/fixtures/silent-2s.mp3"),
  }));
  await page.goto("/surah/3/5");
  await expect(page.locator(".cpv-verse").first()).toBeVisible({
    timeout: 30_000,
  });
  const canonicalTexts = await page.locator('.cpv-verse').evaluateAll(verses => Object.fromEntries(verses.map(verse => [verse.dataset.ayahNumber, verse.querySelector('.qc-ayah-text-ar').textContent])));

  // Immersive reading intentionally hides the chrome after navigation. A
  // pointer movement is the desktop gesture that reveals the audio dock.
  await page.mouse.move(24, 24);
  await expect(page.locator(".mp-player-play-btn")).toBeInViewport();
  await page.locator(".mp-player-play-btn").evaluate((button) => button.click());

  const playingVerse = page.locator(".cpv-verse--playing").first();
  await expect(playingVerse).toBeVisible();
  await expect.poll(() => playingVerse.locator(".warsh-unicode-word.is-tajweed-painted").count()).toBeGreaterThan(0);
  const playingAyah = await playingVerse.getAttribute('data-ayah-number');
  expect(await playingVerse.locator('.qc-ayah-text-ar').textContent()).toBe(canonicalTexts[playingAyah]);
  expect(await playingVerse.locator('.warsh-unicode-word').evaluateAll(words => words.every(word => word.childNodes.length === 1 && word.firstChild.nodeType === Node.TEXT_NODE))).toBe(true);
  await expect(playingVerse.locator(".native-ayah-marker")).toHaveCount(1);
  await expect(playingVerse.locator(".native-ayah-marker")).toHaveCount(1);
  await expect(
    playingVerse.locator(".warsh-karaoke-ayah-marker"),
  ).toHaveCount(0);
});
