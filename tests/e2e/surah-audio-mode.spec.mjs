import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";
import { TONE_MP3 } from "./helpers/tone-mp3.mjs";

// A voice published both ways plays a whole surah as ONE recording (Quran.com
// chapter audio with the position of every verse), and verse by verse for what
// needs a file per verse. Every audio file is a 1.4 s tone.

const CHAPTER_URL = "https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/112.mp3";

// Surah 112 has four verses: each 0.3 s of the 1.4 s tone.
const chapterRecitation = (reciter, surah) =>
  reciter === 7 && surah === 112
    ? {
        audio_file: {
          id: 1,
          chapter_id: 112,
          audio_url: CHAPTER_URL,
          timestamps: [0, 1, 2, 3].map((i) => ({
            verse_key: `112:${i + 1}`,
            timestamp_from: i * 300,
            timestamp_to: (i + 1) * 300,
            segments: [[1, i * 300, i * 300 + 150], [2, i * 300 + 150, (i + 1) * 300]],
          })),
        },
      }
    : null;

async function prepare(page, { timeline = true, mode } = {}) {
  await page.addInitScript((settings) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify(settings));
    window.__plays = [];
    const NativeAudio = window.Audio;
    window.Audio = function TrackedAudio(...args) {
      const audio = new NativeAudio(...args);
      audio.addEventListener("play", () => window.__plays.push((audio.currentSrc || audio.src || "").split("/").pop()));
      return audio;
    };
  }, {
    skipSplashAnimation: true,
    lang: "fr",
    theme: "light",
    riwaya: "hafs",
    reciter: "ar.alafasy",
    showHome: false,
    displayMode: "surah",
    mushafLayout: "list",
    currentSurah: 112,
    currentAyah: 1,
    ...(mode ? { audioPlaybackMode: mode } : {}),
  });
  await installQuranNetworkFixtures(page, timeline ? { chapterRecitation } : {});
  await page.route(/\.mp3(\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: "audio/mpeg", body: TONE_MP3 }));
  await page.goto("/surah/112");
  await expect(page.locator(".qc-list-card").first()).toBeVisible({ timeout: 30_000 });
}

const files = (page) => page.evaluate(() => window.__plays);

// The reader loads the surah's playlist right after its verses; a tap before that
// plays the single verse file. A real reader taps later than the page is ready.
const settle = (page) => page.waitForTimeout(2_000);

test("a whole surah plays as one recording and lands on the verse that was tapped", async ({ page }) => {
  await prepare(page);
  await settle(page);
  await page.locator(".qc-list-card__start .ayah-action--play").nth(1).click();
  await expect.poll(() => files(page), { timeout: 15_000 }).toContain("112.mp3");
  const heard = await files(page);
  expect(heard.filter((name) => /^112\d{3}\.mp3$/.test(name)), "no verse file is requested").toEqual([]);
  // The verse card of the recording's position is the one that is highlighted.
  await expect(page.locator(".qc-list-card.is-playing, .qc-list-card[data-playing='true']").first()).toBeVisible({ timeout: 10_000 });
});

test("when the chapter timing is unavailable the same verse plays from its own file", async ({ page }) => {
  await prepare(page, { timeline: false });
  await settle(page);
  await page.locator(".qc-list-card__start .ayah-action--play").nth(1).click();
  await expect.poll(() => files(page), { timeout: 15_000 }).toContain("112002.mp3");
  expect(await files(page)).not.toContain("112.mp3");
});

test("verse by verse is a choice the reader can make, and it is kept", async ({ page }) => {
  await prepare(page, { mode: "verse" });
  await settle(page);
  await page.locator(".qc-list-card__start .ayah-action--play").first().click();
  await expect.poll(() => files(page), { timeout: 15_000 }).toContain("112001.mp3");
  expect(await files(page)).not.toContain("112.mp3");
});

test("the listening-mode choice is offered for a voice that has both, and changes what plays", async ({ page }) => {
  await prepare(page);
  await settle(page);
  // The player shows its options once a recitation has started.
  await page.locator(".qc-list-card__start .ayah-action--play").first().click();
  await expect.poll(() => files(page), { timeout: 15_000 }).toContain("112.mp3");
  const player = page.locator(".mp-audio-player--desktop").first();
  if (await player.isVisible().catch(() => false)) {
    const reopen = player.locator(".mp-player-minimized-open").first();
    if (await reopen.isVisible().catch(() => false)) await reopen.click();
    await player.locator(".mp-player-options-trigger").first().click();
  } else {
    await page.locator(".mp-audio-player--mobile .mp-player-options-trigger").first().click();
  }
  const modal = page.locator(".audio-player-modal").first();
  await expect(modal).toBeVisible();
  const settingsTab = modal.getByRole("tab", { name: /Lecture|Playback/i });
  if (await settingsTab.isVisible().catch(() => false)) await settingsTab.click();
  const group = modal.getByRole("group", { name: "Mode d’écoute" });
  await expect(group).toBeVisible();
  await expect(group.getByRole("button", { name: "Auto" })).toHaveAttribute("aria-pressed", "true");
  for (const button of await group.getByRole("button").all()) {
    expect((await button.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(30);
  }
  await group.getByRole("button", { name: "Verset par verset" }).click();
  await expect(group.getByRole("button", { name: "Verset par verset" })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  // The tone ends within a second and a half, so the recitation may have moved on:
  // what the choice decides is how the NEXT recitation is played.
  const before = (await files(page)).length;
  await page.locator(".qc-list-card__start .ayah-action--play").first().click();
  await expect
    .poll(async () => (await files(page)).slice(before).some((name) => /^[0-9]{6}\.mp3$/.test(name)), { timeout: 15_000 })
    .toBe(true);
  expect((await files(page)).slice(before)).not.toContain("112.mp3");
});
