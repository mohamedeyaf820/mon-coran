/**
 * Whole-surah playback with verse timing (Quran.com chapter recitations):
 * which lists take the single recording, how a verse is found inside it, and
 * what happens when the timing cannot be trusted.
 */
import assert from "node:assert/strict";
import test from "node:test";

globalThis.window = { location: { href: "https://qa.test/" } };
globalThis.document = {
  visibilityState: "visible",
  hidden: false,
  addEventListener() {},
  removeEventListener() {},
};
globalThis.Audio = class extends EventTarget {
  src = "";
  readyState = 4;
  currentTime = 0;
  duration = 40;
  paused = true;
  setAttribute() {}
  removeAttribute() { this.src = ""; }
  load() {}
  pause() { this.paused = true; }
  play() { this.paused = false; return Promise.resolve(); }
};

const { AudioService } = await import("../src/services/audioService.js");
const { getChapterAudioTimeline } = await import("../src/services/quranComAudioTimingService.js");
const { findTimelineVerse, getSurahStreamSeekSeconds, resolveSurahStreamAyah } = await import("../src/utils/surahStreamSync.js");
const { getSurahTwinRecitationId } = await import("../src/services/surahAudioSources.js");

const FATIHA_URL = "https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/1.mp3";
const ALAFASY = { cdn: "Alafasy/mp3/", cdnType: "quran-cdn" };

// Seven verses of three seconds, word segments inside each (milliseconds in the file).
function chapterJson({ keys } = {}) {
  const timestamps = Array.from({ length: 7 }, (_, i) => ({
    verse_key: keys?.[i] ?? `1:${i + 1}`,
    timestamp_from: i * 3000,
    timestamp_to: (i + 1) * 3000,
    segments: [[1, i * 3000 - 40, i * 3000 + 900], [2, i * 3000 + 900, (i + 1) * 3000], [1]],
  }));
  return { audio_file: { id: 1, chapter_id: 1, audio_url: FATIHA_URL, timestamps } };
}

function stubFetch(handler) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    const body = handler(String(url));
    if (body instanceof Error) throw body;
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  };
  return { calls, restore: () => { globalThis.fetch = original; } };
}

const fatiha = () => Array.from({ length: 7 }, (_, i) => ({ surah: 1, numberInSurah: i + 1, number: i + 1, text: `v${i + 1}` }));

test("only voices published both ways are listed, by the files they already play", () => {
  assert.equal(getSurahTwinRecitationId(ALAFASY.cdn, ALAFASY.cdnType), 7);
  assert.equal(getSurahTwinRecitationId("Husary_128kbps", "everyayah"), 6);
  assert.equal(getSurahTwinRecitationId("Minshawi/Murattal/mp3/", "quran-cdn"), 9);
  assert.equal(getSurahTwinRecitationId("Minshawi_Mujawwad_192kbps", "everyayah"), null, "its timeline is not usable");
  assert.equal(getSurahTwinRecitationId("Alafasy/mp3/", "everyayah"), null);
});

test("the timeline keeps verses in order, in seconds, with words relative to their verse", async () => {
  const net = stubFetch(() => chapterJson());
  try {
    const timeline = await getChapterAudioTimeline(7, 1, 7);
    assert.equal(timeline.url, FATIHA_URL);
    assert.deepEqual(timeline.verses.map((v) => v.ayah), [1, 2, 3, 4, 5, 6, 7]);
    assert.equal(timeline.verses[2].from, 6);
    assert.equal(timeline.verses[2].to, 9);
    // A word that starts a hair before its verse is clamped, junk segments are dropped.
    assert.equal(timeline.verses[3].segments.length, 2);
    assert.equal(timeline.verses[3].segments[0].startMs, 0);
    assert.equal(timeline.verses[3].segments[1].startMs, 900);
    assert.ok(net.calls[0].includes("/chapter_recitations/7/1?segments=true"));
  } finally {
    net.restore();
  }
});

test("a timeline that does not describe the whole surah is refused", async () => {
  for (const [label, json, expected] of [
    ["missing a verse", (() => { const j = chapterJson(); j.audio_file.timestamps.pop(); return j; })(), 7],
    ["wrong surah", chapterJson({ keys: Array.from({ length: 7 }, (_, i) => `2:${i + 1}`) }), 7],
    ["starts at the wrong verse", chapterJson({ keys: Array.from({ length: 7 }, (_, i) => `1:${i + 2}`) }), 7],
    ["no file", { audio_file: { timestamps: chapterJson().audio_file.timestamps } }, 7],
    ["no timing", { audio_file: { audio_url: FATIHA_URL, timestamps: [] } }, 7],
  ]) {
    // A fresh surah number per case keeps the memory cache of the service out of the way.
    const net = stubFetch(() => json);
    try {
      await assert.rejects(() => getChapterAudioTimeline(70 + Math.floor(Math.random() * 1000), 1, expected), undefined, label);
    } finally {
      net.restore();
    }
  }
});

test("a verse is found from the position in the recording, and the other way round", async () => {
  const net = stubFetch(() => chapterJson());
  try {
    const timeline = await getChapterAudioTimeline(7001, 1, 7);
    assert.equal(findTimelineVerse(timeline, 0).ayah, 1);
    assert.equal(findTimelineVerse(timeline, 2.99).ayah, 1);
    assert.equal(findTimelineVerse(timeline, 3).ayah, 2, "the boundary belongs to the next verse");
    assert.equal(findTimelineVerse(timeline, 19.5).ayah, 7);
    assert.equal(findTimelineVerse(timeline, 999).ayah, 7, "past the end stays on the last verse");
    assert.equal(getSurahStreamSeekSeconds({ timeline }, 5), 12);
    assert.equal(getSurahStreamSeekSeconds({ timeline }, 8), null);

    const source = fatiha();
    const item = { surah: 1, ayah: null, timeline };
    const at = resolveSurahStreamAyah(source, item, 7.2);
    assert.equal(at.ayah, 3);
    assert.equal(at.text, "v3");
    assert.deepEqual(at.verseWindow, { from: 6, to: 9 });
    assert.equal(resolveSurahStreamAyah(source, item, 0, 40, 6).ayah, 6, "a requested verse wins over the position");
    // Without timing nothing can be said about the verse (legacy streams).
    assert.equal(resolveSurahStreamAyah(source, { surah: 1, ayah: null }, 5).ayah, null);
  } finally {
    net.restore();
  }
});

test("routing: a whole surah of a voice with a twin plays as one recording, everything else as verse files", () => {
  const service = new AudioService();
  try {
    service.loadPlaylist(fatiha(), ALAFASY.cdn, ALAFASY.cdnType);
    assert.equal(service.isWholeSurahPlayback, true);
    assert.equal(service.playlist.length, 1);
    assert.equal(service.isLoadedFor(ALAFASY.cdn, ALAFASY.cdnType), true, "the reciter in the settings still matches");

    service.loadPlaylist(fatiha().slice(0, 5), ALAFASY.cdn, ALAFASY.cdnType);
    assert.equal(service.isWholeSurahPlayback, false, "a page or a range is verse by verse");
    assert.equal(service.playlist.length, 5);

    service.loadPlaylist(fatiha().map((v) => ({ ...v, riwaya: "warsh" })), ALAFASY.cdn, ALAFASY.cdnType);
    assert.equal(service.isWholeSurahPlayback, false, "Warsh numbering is not the Hafs recording's");

    service.loadPlaylist(fatiha(), "Ghamadi_40kbps", "everyayah");
    assert.equal(service.isWholeSurahPlayback, false, "no twin for this voice");

    service.loadPlaylist(fatiha(), ALAFASY.cdn, ALAFASY.cdnType, { mode: "verse" });
    assert.equal(service.isWholeSurahPlayback, false);
    service.setPlaybackMode("verse");
    service.loadPlaylist(fatiha(), ALAFASY.cdn, ALAFASY.cdnType);
    assert.equal(service.isWholeSurahPlayback, false, "the reader's choice");
    service.setPlaybackMode("auto");

    service.setAbRepeat(0, 3);
    service.loadPlaylist(fatiha(), ALAFASY.cdn, ALAFASY.cdnType);
    assert.equal(service.isWholeSurahPlayback, false, "a loop counts verses");
    service.clearAbRepeat();
    service.setTartilMode(true, 1);
    service.loadPlaylist(fatiha(), ALAFASY.cdn, ALAFASY.cdnType);
    assert.equal(service.isWholeSurahPlayback, false, "progressive speeds are set per verse");
  } finally {
    service.destroy();
  }
});

test("playing a verse of a whole-surah recording starts on that verse and follows it", async () => {
  const net = stubFetch(() => chapterJson());
  const service = new AudioService();
  try {
    service.loadPlaylist(fatiha(), ALAFASY.cdn, ALAFASY.cdnType);
    const index = service.indexOfAyah(1, 4);
    assert.equal(index, 0, "the surah is the one item");
    await service.loadAndPlay(index, { ayah: 4 });

    assert.equal(service.audio.src, FATIHA_URL);
    assert.equal(service.audio.currentTime, 9, "opens on the verse, not on verse 1");
    assert.equal(service.currentAyah.ayah, 4);
    assert.equal(service.currentAyah.segments.length, 2);
    assert.equal(service.verseClock().time, 0);
    assert.equal(service.verseClock().duration, 3);

    // The recitation moves on by itself: the verse follows the position.
    const heard = [];
    service.addAyahChangeListener((item) => heard.push(item.ayah));
    service.audio.currentTime = 12.5;
    service.audio.dispatchEvent(new Event("timeupdate"));
    assert.deepEqual(heard, [5]);
    assert.ok(Math.abs(service.verseClock().time - 0.5) < 1e-9);

    // Next and previous verse are seeks inside the same recording.
    service.next();
    assert.equal(service.audio.currentTime, 15);
    service.prev();
    service.prev();
    assert.equal(service.audio.currentTime, 9);
    assert.equal(service.audio.src, FATIHA_URL, "no source change, so no gap in the background");
  } finally {
    service.destroy();
    net.restore();
  }
});

test("when the timing cannot be used the same verse plays from its own file", async () => {
  // Another voice than the other tests: the service remembers timelines it already fetched.
  const husary = { cdn: "Husary_128kbps", cdnType: "everyayah" };
  const net = stubFetch(() => new Error("offline"));
  const service = new AudioService();
  try {
    service.loadPlaylist(fatiha(), husary.cdn, husary.cdnType);
    assert.equal(service.isWholeSurahPlayback, true);
    await service.loadAndPlay(0, { ayah: 3 });
    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(service.isWholeSurahPlayback, false);
    assert.equal(service.playlist.length, 7);
    assert.ok(service.audio.src.endsWith("001003.mp3"), service.audio.src);
    assert.equal(service.currentAyah.ayah, 3);

    // The failure is remembered: reloading the list does not retry the recording.
    service.loadPlaylist(fatiha(), husary.cdn, husary.cdnType);
    assert.equal(service.isWholeSurahPlayback, false);
  } finally {
    service.destroy();
    net.restore();
  }
});

test("leaving the whole-surah recording keeps the verse that is playing", async () => {
  const net = stubFetch(() => chapterJson());
  const service = new AudioService();
  try {
    service.loadPlaylist(fatiha(), ALAFASY.cdn, ALAFASY.cdnType);
    await service.loadAndPlay(0, { ayah: 6 });
    assert.equal(service.currentAyah.ayah, 6);
    await service.enterVerseMode();
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(service.isWholeSurahPlayback, false);
    assert.equal(service.playlist.length, 7);
    assert.equal(service.playlistIndex, 5);
    assert.equal(service.currentAyah.ayah, 6);
    assert.ok(service.audio.src.endsWith("001006.mp3"), service.audio.src);
  } finally {
    service.destroy();
    net.restore();
  }
});
