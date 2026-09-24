import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";

const CLIP = fs.readFileSync(path.join("tests", "fixtures", "silent-2s.mp3"));
const AUDIO_CACHE = "mushafplus-audio-v2";

test.use({ serviceWorkers: "allow" });

async function seedPlayer(page) {
  await installQuranNetworkFixtures(page);
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: true,
        showDuas: false,
        sidebarOpen: false,
        displayMode: "surah",
        mushafLayout: "list",
        lang: "fr",
        riwaya: "hafs",
        reciter: "muhammad_ayyoub",
        showTranslation: false,
        showWordByWord: false,
        lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
      }),
    );
    const NativeAudio = window.Audio;
    window.Audio = function TrackedAudio(...args) {
      const audio = new NativeAudio(...args);
      window.__playerAudio ??= audio;
      return audio;
    };
    window.Audio.prototype = NativeAudio.prototype;
  });
  await page.route(/\.mp3(?:\?.*)?$/i, (route) =>
    route.fulfill({
      status: 200,
      contentType: "audio/mpeg",
      body: CLIP,
    }),
  );
}

async function openControlledShell(page) {
  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 30_000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload();
    await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 30_000 });
  }
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
}

async function downloadFatiha(page) {
  await page.getByRole("tab", { name: "Audio", exact: true }).click();
  await page
    .getByRole("textbox", { name: /Rechercher un récitateur/ })
    .fill("Ayyoub");
  const firstCard = page.locator('[data-reciter-card="true"]').first();
  await expect(firstCard).toBeVisible();
  await firstCard.locator(".reciter-card__main").click();
  await page.getByRole("textbox", { name: "Rechercher une sourate" }).fill("Fatiha");
  await page
    .getByRole("button", {
      name: /Télécharger pour l’écoute hors connexion.*L'Ouverture \(1\)/,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: /Disponible hors connexion.*L'Ouverture \(1\)/,
    }),
  ).toBeVisible({ timeout: 30_000 });
}

async function playerState(page) {
  return page.evaluate(() => {
    const audio = window.__playerAudio;
    return audio
      ? {
          time: Number(audio.currentTime.toFixed(2)),
          paused: audio.paused,
          file: (audio.currentSrc || "").split("/").pop(),
        }
      : null;
  });
}

test("a downloaded surah keeps playing verse by verse with no network", async ({
  page,
  context,
}) => {
  await seedPlayer(page);
  await openControlledShell(page);
  await downloadFatiha(page);

  await expect
    .poll(
      async () =>
        page.evaluate(async (cacheName) => {
          const cache = await caches.open(cacheName);
          const keys = (await cache.keys()).map((request) =>
            new URL(request.url).pathname.split("/").pop(),
          );
          return keys.sort().join(",");
        }, AUDIO_CACHE),
      { message: "every downloaded verse is in the offline cache" },
    )
    .toBe(
      [1, 2, 3, 4, 5, 6, 7]
        .map((ayah) => `00100${ayah}.mp3`)
        .join(","),
    );

  await page.goto("/surah/1");
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({
    timeout: 30_000,
  });

  await context.setOffline(true);
  await page.locator(".srh-play-btn").first().click();

  await expect
    .poll(async () => (await playerState(page))?.file)
    .toBe("001001.mp3");

  const first = await playerState(page);
  expect(first, "the player opened an audio element").not.toBeNull();
  expect(first.file).toBe("001001.mp3");
  expect(first.paused, "the cached verse plays with no network").toBe(false);
  await expect
    .poll(() => page.locator(".is-playing").count(), { timeout: 10_000 })
    .toBeGreaterThan(0);

  // The fixture is two seconds long, so the queue has to roll on by itself.
  await expect
    .poll(async () => (await playerState(page)).file, { timeout: 20_000 })
    .not.toBe("001001.mp3");
  const next = await playerState(page);
  expect(next.paused, "the following verse kept playing").toBe(false);
});

test("playback keeps running when the reader loses the foreground", async ({
  page,
}) => {
  await seedPlayer(page);
  await openControlledShell(page);
  await downloadFatiha(page);

  await page.goto("/surah/1");
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({
    timeout: 30_000,
  });
  await page.locator(".srh-play-btn").first().click();
  await expect
    .poll(async () => {
      const state = await playerState(page);
      return Boolean(state?.file && !state.paused);
    })
    .toBe(true);

  const started = await playerState(page);
  // What a phone does when the user leaves the app: another document takes
  // the foreground and the browser stops running animation frames here.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    window.requestAnimationFrame = () => {
      throw new Error("requestAnimationFrame is suspended in the background");
    };
  });

  await page.waitForTimeout(2500);
  const during = await playerState(page);
  expect(during.paused, "playback survived the loss of foreground").toBe(false);
  expect(
    during.file !== started.file || during.time > started.time,
    "the verse position moved or the next verse began",
  ).toBe(true);
  await expect
    .poll(async () => (await playerState(page)).file, { timeout: 20_000 })
    .not.toBe(started.file);
});
