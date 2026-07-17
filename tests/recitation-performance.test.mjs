import assert from "node:assert/strict";
import test from "node:test";

class MockAudio {
  constructor() {
    this.currentTime = 0;
    this.duration = 30;
    this.paused = true;
    this.playbackRate = 1;
    this.readyState = 0;
    this.src = "";
    this.volume = 1;
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  load() {}

  pause() {
    this.paused = true;
  }

  play() {
    this.paused = false;
    return Promise.resolve();
  }

  removeAttribute(name) {
    if (name === "src") this.src = "";
  }
}

globalThis.window = { location: { href: "http://localhost/" } };
globalThis.Audio = MockAudio;

const playlistModule = await import("../src/utils/audioPlaylist.js");
const recitationModule = await import("../src/services/RecitationService.js");
const { AudioService } = await import("../src/services/audioService.js");

test("recitation performance: Warsh playlists are built locally without text fetches", async () => {
  const previousFetch = globalThis.fetch;
  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount += 1;
    throw new Error("unexpected network request");
  };

  try {
    const playlist = await playlistModule.buildAudioPlaylistForSurah(2, "warsh");
    assert.equal(playlist.length, 286);
    assert.deepEqual(
      {
        surah: playlist[0].surah,
        ayah: playlist[0].ayah,
        number: playlist[0].number,
      },
      { surah: 2, ayah: 1, number: 8 },
    );
    assert.equal(playlist.at(-1).ayah, 286);
    assert.equal(fetchCount, 0);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("recitation performance: surah-stream radio keeps one item per surah", async () => {
  const playlist = await recitationModule.buildContinuousRadioPlaylist(
    1,
    "warsh",
    "mp3quran-surah",
  );

  assert.equal(playlist.length, 114);
  assert.equal(new Set(playlist.map((item) => item.surah)).size, 114);
  assert.equal(playlist[0].surah, 1);
  assert.equal(playlist.at(-1).surah, 114);
});

test("audio performance: a rapid verse change supersedes the stale load cleanly", async () => {
  const service = new AudioService();
  const errors = [];
  const played = [];
  service.onError = (error) => errors.push(error);
  service.onPlay = (item) => played.push(`${item.surah}:${item.ayah}`);
  service.loadPlaylist(
    playlistModule.buildSurahAudioPlaylist(1),
    "Abu_Bakr_Ash-Shaatree_128kbps",
    "everyayah",
  );

  const first = service.loadAndPlay(0);
  const second = service.loadAndPlay(1);
  await Promise.all([first, second]);

  assert.deepEqual(errors, []);
  assert.deepEqual(played, ["1:2"]);
  assert.equal(service.currentAyah.ayah, 2);
  assert.match(service.audio.src, /001002\.mp3$/);
  service.destroy();
});
