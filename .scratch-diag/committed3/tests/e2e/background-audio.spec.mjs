import { expect, test } from "@playwright/test";

test("mobile media session exposes lock-screen metadata, progress and controls", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: false,
        showDuas: false,
        currentSurah: 1,
        currentAyah: 1,
        displayMode: "surah",
        lang: "fr",
        riwaya: "hafs",
      }),
    );

    const positions = new WeakMap();
    Object.defineProperty(HTMLMediaElement.prototype, "duration", {
      configurable: true,
      get() {
        return 180;
      },
    });
    Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
      configurable: true,
      get() {
        return positions.get(this) || 0;
      },
      set(value) {
        positions.set(this, Number(value) || 0);
        window.__lastMediaSeek = Number(value) || 0;
      },
    });

    const NativeAudio = window.Audio;
    window.Audio = function BackgroundAudio(...args) {
      const audio = new NativeAudio(...args);
      window.__backgroundAudioElement = audio;
      return audio;
    };

    window.MediaMetadata = class MediaMetadata {
      constructor(value) {
        Object.assign(this, value);
      }
    };
    const handlers = {};
    const session = {
      metadata: null,
      playbackState: "none",
      positionState: null,
      setActionHandler(action, handler) {
        handlers[action] = handler;
      },
      setPositionState(value) {
        this.positionState = value;
      },
    };
    Object.defineProperty(navigator, "mediaSession", {
      configurable: true,
      value: session,
    });
    window.__mediaSessionHandlers = handlers;
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/surah/1");
  await expect(page.locator(".quran-display")).toBeVisible({ timeout: 30_000 });

  await expect
    .poll(() =>
      page.evaluate(() =>
        [
          "play",
          "pause",
          "nexttrack",
          "previoustrack",
          "seekto",
          "seekbackward",
          "seekforward",
          "stop",
        ].every((action) => typeof window.__mediaSessionHandlers?.[action] === "function"),
      ),
    )
    .toBe(true);

  await page.evaluate(() => {
    window.__backgroundAudioElement.currentTime = 42;
    window.__backgroundAudioElement.dispatchEvent(new Event("timeupdate"));
  });
  await expect
    .poll(() => page.evaluate(() => navigator.mediaSession.positionState))
    .toMatchObject({ duration: 180, position: 42 });

  const mediaState = await page.evaluate(() => ({
    title: navigator.mediaSession.metadata?.title,
    album: navigator.mediaSession.metadata?.album,
    artwork: navigator.mediaSession.metadata?.artwork?.[0]?.src,
    playsInline: window.__backgroundAudioElement.hasAttribute("playsinline"),
  }));
  expect(mediaState.title?.length || 0).toBeGreaterThan(0);
  expect(mediaState.album).toBe("MushafPlus");
  expect(mediaState.artwork).toContain("/logo-512.png");
  expect(mediaState.playsInline).toBe(true);

  await page.evaluate(() =>
    window.__mediaSessionHandlers.seekto({ seekTime: 75, fastSeek: false }),
  );
  expect(await page.evaluate(() => window.__lastMediaSeek)).toBe(75);
});
