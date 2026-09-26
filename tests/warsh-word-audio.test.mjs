/**
 * Warsh word-by-word audio disclosure.
 *
 * The qurancdn /wbw/ library is keyed on Hafs numbers only, so a word tap in
 * Warsh can only ever recite a Hafs recording. The rules locked here:
 * playback keeps working (fallback), the Hafs-only notice fires at most once
 * per session, and the Hafs path is untouched.
 */
import assert from "node:assert/strict";
import test from "node:test";

const toasts = [];
const playedSrc = [];
const plays = [];
let createdElements = 0;
let activeRiwaya = "hafs";

globalThis.CustomEvent = class FakeCustomEvent {
  constructor(type, init) {
    this.type = type;
    this.detail = init?.detail;
  }
};
globalThis.window = {
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: (event) => toasts.push(event.detail),
};
globalThis.document = {
  documentElement: { getAttribute: (name) => (name === "lang" ? "fr" : null) },
  querySelector: (selector) =>
    selector === "[data-riwaya]"
      ? { getAttribute: () => activeRiwaya }
      : null,
};
globalThis.Audio = class FakeAudio {
  constructor(src) {
    createdElements += 1;
    this._listeners = {};
    this.src = src || "";
    if (src) playedSrc.push(src);
  }
  addEventListener(type, fn) {
    (this._listeners[type] ||= []).push(fn);
  }
  removeAttribute(name) {
    if (name === "src") this.src = "";
  }
  load() {}
  play() {
    if (this.src) {
      playedSrc.push(this.src);
      plays.push(this.src);
    }
    // Real elements fire `ended`, which releases the decoder; mimic it so the
    // release path runs in this test too.
    Promise.resolve().then(() =>
      (this._listeners.ended || []).forEach((fn) => fn()),
    );
    return Promise.resolve();
  }
  pause() {}
  set currentTime(_value) {}
};

const flush = async (times = 6) => {
  for (let i = 0; i < times; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

const { getWordAudioUrl, playWordAudio, resetWarshFallbackNotice } =
  await import("../src/utils/wordAudio.js");
const { t } = await import("../src/i18n/index.js");

test("Hafs word audio keeps its existing url and never warns", async () => {
  activeRiwaya = "hafs";
  resetWarshFallbackNotice();
  toasts.length = 0;
  playedSrc.length = 0; plays.length = 0;

  assert.equal(
    getWordAudioUrl(2, 286, 3),
    "https://audio.qurancdn.com/wbw/002_286_003.mp3",
  );
  playWordAudio(2, 286, 3);
  await flush();
  playWordAudio({ surah: 9, ayah: 129, position: 1 });
  await flush();


  assert.equal(plays.length, 2, "both hafs taps played");
  assert.equal(createdElements, 1, "one shared element serves every tap");
  assert.equal(toasts.length, 0, "hafs path stays silent");
});

test("a warsh word tap still plays but discloses the hafs-only notice once", async () => {
  activeRiwaya = "warsh";
  resetWarshFallbackNotice();
  toasts.length = 0;
  playedSrc.length = 0; plays.length = 0;

  playWordAudio(9, 130, 1);
  await flush();
  playWordAudio(67, 31, 2);
  await flush();

  assert.equal(plays.length, 2, "fallback playback is preserved");
  assert.equal(createdElements, 1, "the warsh fallback reuses the same element");
  assert.equal(toasts.length, 1, "one notice per session");
  assert.equal(
    toasts[0].message,
    t("errors.warshWordAudioHafs", "fr"),
    "the disclosure names the Hafs fallback in all three dictionaries",
  );
  for (const lang of ["fr", "en", "ar"]) {
    assert.notEqual(
      t(`errors.warshWordAudioHafs`, lang),
      "errors.warshWordAudioHafs",
      `key resolves in ${lang}`,
    );
  }
});

test("invalid coordinates stay no-ops even in warsh", async () => {
  activeRiwaya = "warsh";
  resetWarshFallbackNotice();
  toasts.length = 0;
  playedSrc.length = 0; plays.length = 0;

  playWordAudio(null);
  playWordAudio({});
  await flush();

  assert.equal(playedSrc.length, 0);
  assert.equal(toasts.length, 0, "nothing is played, so nothing is disclosed");
});
