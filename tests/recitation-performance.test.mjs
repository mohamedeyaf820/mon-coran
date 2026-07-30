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

test("audio sync: a full-surah stream exposes and advances the active ayah", async () => {
  const service = new AudioService();
  const changes = [];
  service.onAyahChange = (item) => changes.push(item.ayah);
  service.loadPlaylist(
    [
      { surah: 2, ayah: 1, number: 8, text: "الم" },
      {
        surah: 2,
        ayah: 2,
        number: 9,
        text: "ذلك الكتاب لا ريب فيه هدى للمتقين",
      },
      {
        surah: 2,
        ayah: 3,
        number: 10,
        text: "الذين يؤمنون بالغيب ويقيمون الصلاة",
      },
    ],
    "https://server13.mp3quran.net/warsh/",
    "mp3quran-surah",
  );

  await service.loadAndPlay(0);
  assert.equal(service.currentAyah.ayah, 1);
  assert.equal(service.currentAyah.estimatedTiming, true);

  service.audio.duration = 90;
  service.audio.currentTime = 80;
  service._boundTimeUpdate();
  assert.equal(service.currentAyah.ayah, 3);
  assert.deepEqual(changes, [1, 3]);
  service.destroy();
});

test("audio sync: selecting an ayah seeks within a full-surah stream", async () => {
  const service = new AudioService();
  service.loadPlaylist(
    [
      { surah: 3, ayah: 1, number: 293, text: "الم" },
      { surah: 3, ayah: 2, number: 294, text: "الله لا إله إلا هو الحي القيوم" },
      { surah: 3, ayah: 3, number: 295, text: "نزل عليك الكتاب بالحق" },
    ],
    "https://server13.mp3quran.net/warsh/",
    "mp3quran-surah",
  );
  service.audio.duration = 120;

  service.playAyah(3, 3);
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(service.currentAyah.ayah, 3);
  assert.ok(service.audio.currentTime > 0);
  service.destroy();
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

test("audio performance: rapid reciter changes are serialized and latest wins", async () => {
  const service = new AudioService();
  const calls = [];
  let releaseFirstSwitch;
  const firstSwitchGate = new Promise((resolve) => {
    releaseFirstSwitch = resolve;
  });

  service._switchReciterNow = async (reciterCdn) => {
    calls.push(reciterCdn);
    if (reciterCdn === "first") await firstSwitchGate;
    return true;
  };

  const first = service.switchReciter("first");
  await new Promise((resolve) => setImmediate(resolve));
  const intermediate = service.switchReciter("intermediate");
  const latest = service.switchReciter("latest");
  releaseFirstSwitch();

  assert.deepEqual(await Promise.all([first, intermediate, latest]), [
    false,
    false,
    true,
  ]);
  assert.deepEqual(calls, ["first", "latest"]);
  service.destroy();
});

test("audio lifecycle: play and pause subscribers drive pausable consumers", async () => {
  const service = new AudioService();
  const events = [];
  service.playlist = [{ surah: 1, ayah: 1 }];
  service.playlistIndex = 0;
  service.currentAyah = service.playlist[0];
  service.audio.src = "https://everyayah.com/data/test/001001.mp3";

  const unsubscribePlay = service.addPlayListener((item) => {
    events.push(`play:${item.surah}:${item.ayah}`);
  });
  const unsubscribePause = service.addPauseListener((item) => {
    events.push(`pause:${item.surah}:${item.ayah}`);
  });

  service.resume();
  await new Promise((resolve) => setImmediate(resolve));
  service.pause();
  assert.deepEqual(events, ["play:1:1", "pause:1:1"]);

  unsubscribePlay();
  unsubscribePause();
  service.resume();
  await new Promise((resolve) => setImmediate(resolve));
  service.pause();
  assert.deepEqual(events, ["play:1:1", "pause:1:1"]);
  service.destroy();
});
