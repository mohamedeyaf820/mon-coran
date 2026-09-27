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
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({
    timeout: 30_000,
  });

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
test("a hidden verse boundary swaps the source inside the event task", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: false,
        showDuas: false,
        sidebarOpen: false,
        displayMode: "surah",
        mushafLayout: "list",
        lang: "fr",
        riwaya: "hafs",
        lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
      }),
    );

    // A controllable media element: the state is observable and `play()` is
    // honoured without depending on a real CDN download.
    const paused = new WeakMap();
    Object.defineProperty(HTMLMediaElement.prototype, "paused", {
      configurable: true,
      get() {
        return paused.get(this) !== false;
      },
      set(value) {
        paused.set(this, Boolean(value));
      },
    });
    HTMLMediaElement.prototype.play = function acceptedPlay() {
      paused.set(this, false);
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    };

    const NativeAudio = window.Audio;
    const createdAudioElements = [];
    window.Audio = function BackgroundAudio(...args) {
      const audio = new NativeAudio(...args);
      createdAudioElements.push(audio);
      return audio;
    };
    Object.defineProperty(window, "__handoffAudio", {
      configurable: true,
      get() {
        // AudioService marks its one authoritative element with the legacy
        // iOS attribute; preload and word-audio elements do not. React's dev
        // lifecycle may construct more than one service, so prefer the live
        // marked element instead of the first object created.
        const serviceElements = createdAudioElements.filter((audio) =>
          audio.hasAttribute("webkit-playsinline"));
        return serviceElements.find((audio) => audio.src) ||
          serviceElements.at(-1) || createdAudioElements.at(-1);
      },
    });

    window.MediaMetadata = class MediaMetadata {
      constructor(value) {
        Object.assign(this, value);
      }
    };
    window.__playbackStates = [];
    let state = "none";
    const session = {
      metadata: null,
      positionState: null,
      setActionHandler() {},
      setPositionState(value) {
        this.positionState = value;
      },
    };
    Object.defineProperty(session, "playbackState", {
      configurable: true,
      get() {
        return state;
      },
      set(value) {
        window.__playbackStates.push(value);
        state = value;
      },
    });
    Object.defineProperty(navigator, "mediaSession", {
      configurable: true,
      value: session,
    });
  });

  await page.goto("/surah/1");
  await expect(page.locator(".quran-display")).toBeVisible({ timeout: 30_000 });
  // The reader chrome is the real control surface: clicking Listen loads the
  // playlist and starts the recitation through the ordinary service path.
  await page.locator(".srh-play-btn").first().click();
  await expect
    .poll(() => page.evaluate(() => window.__handoffAudio?.src || ""), {
      timeout: 30_000,
    })
    .toMatch(/\.mp3$/);

  const transition = await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    const audio = window.__handoffAudio;
    const before = audio.src;
    window.__playbackStates.length = 0;
    // One single task: the next verse must be selected and started in here.
    audio.dispatchEvent(new Event("ended"));
    return { before, after: audio.src, paused: audio.paused };
  });

  expect(transition.before).not.toBe("");
  expect(transition.after).not.toBe(transition.before);
  expect(transition.after).toMatch(/\.mp3$/);
  expect(transition.paused).toBe(false);

  await expect
    .poll(() => page.evaluate(() => navigator.mediaSession.playbackState))
    .toBe("playing");
  expect(await page.evaluate(() => window.__playbackStates)).not.toContain("paused");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .querySelector('[data-testid="surah-play"]')
            ?.classList.contains("srh-play-btn--playing") === true,
      ),
    )
    .toBe(true);
});
