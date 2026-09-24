/**
 * The mushaf opens every surah (but At-Tawba) with the basmala, and the verse
 * files do not carry it: Quran.com's own timing for Alafasy 2:1 spans the whole
 * 7-second file with the single word ألم (segment [0,1,30,7080]), so the player
 * has to pre-roll the reciter's own 001001.mp3 — Al-Fatiha's first verse IS the
 * basmala in both riwayas. These tests pin that the pre-roll is heard but is
 * never treated as a verse.
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
  #src = "";
  readyState = 4;
  currentTime = 0;
  // A measured basmala length: Al-Husary's 001001.mp3 runs 5.1 s.
  duration = 5.1;
  paused = true;
  setAttribute() {}
  removeAttribute() {
    this.#src = "";
  }
  get src() {
    return this.#src;
  }
  set src(value) {
    this.#src = value;
  }
  load() {}
  pause() {
    this.paused = true;
  }
  play() {
    this.paused = false;
    return Promise.resolve();
  }
};

const { AudioService } = await import("../src/services/audioService.js");
const { basmalaPrerollUrl, hasBasmalaPreroll } = await import(
  "../src/services/audioUrlBuilder.js"
);

const HUSARY = "Husary_128kbps";
const BASMALA = `https://everyayah.com/data/${HUSARY}/001001.mp3`;
const settle = () => new Promise((resolve) => setImmediate(resolve));

/** A service whose main element records every src it is pointed at. */
function harness(ayahs, cdnType = "everyayah", reciterCdn = HUSARY) {
  const service = new AudioService();
  const seen = [];
  Object.defineProperty(service.audio, "src", {
    configurable: true,
    get() {
      return this.__src || "";
    },
    set(value) {
      this.__src = value;
      seen.push(value);
    },
  });
  service.loadPlaylist(ayahs, reciterCdn, cdnType);
  return { service, seen };
}

test("the basmala file is the reciter's own Al-Fatiha verse 1", () => {
  assert.equal(
    basmalaPrerollUrl(HUSARY, "everyayah", 2),
    "https://everyayah.com/data/Husary_128kbps/001001.mp3",
  );
  assert.equal(
    basmalaPrerollUrl("Alafasy/mp3/", "quran-cdn", 2),
    "https://audio.qurancdn.com/Alafasy/mp3/001001.mp3",
  );
  assert.equal(
    basmalaPrerollUrl("262", "quranpedia", 2),
    "https://files.quranpedia.net/recitations/262/001001.mp3",
  );
});

test("Al-Fatiha, At-Tawba and whole-surah streams get no pre-roll", () => {
  // Al-Fatiha opens with the basmala; At-Tawba has none; a stream file already
  // carries its own opening, and a second one would be a corruption of it.
  assert.equal(basmalaPrerollUrl(HUSARY, "everyayah", 1), null);
  assert.equal(basmalaPrerollUrl(HUSARY, "everyayah", 9), null);
  assert.equal(basmalaPrerollUrl(HUSARY, "everyayah", 114), BASMALA);
  assert.equal(basmalaPrerollUrl("", "everyayah", 2), null);
  assert.equal(basmalaPrerollUrl(HUSARY, "mp3quran-surah", 2), null);
  assert.equal(hasBasmalaPreroll("everyayah", 2), true);
});

test("a surah opens with the basmala, and only then reports its first verse", async () => {
  const { service, seen } = harness([
    { surah: 2, ayah: 1, number: 7, hafsNumber: 1 },
    { surah: 2, ayah: 2, number: 8, hafsNumber: 2 },
  ]);
  const changes = [];
  service.onAyahChange = (item) => changes.push(`${item.surah}:${item.ayah}`);

  const playing = service.loadAndPlay(0);
  await settle();
  assert.deepEqual(seen, [BASMALA], "only the basmala is loaded while it plays");
  assert.deepEqual(changes, [], "the verse is not announced during the basmala");

  service.audio.dispatchEvent(new Event("ended"));
  await playing;
  assert.equal(seen[1], `https://everyayah.com/data/${HUSARY}/002001.mp3`);
  assert.deepEqual(changes, ["2:1"], "one verse change, after the basmala");
  assert.equal(service.playlistIndex, 0, "the basmala must not advance the queue");
  service.destroy();
});

test("the basmala drives neither the word highlight nor the seek bar", async () => {
  const { service } = harness([
    { surah: 2, ayah: 1, number: 7, hafsNumber: 1 },
  ]);
  let updates = 0;
  service.onTimeUpdate = () => {
    updates += 1;
  };
  const playing = service.loadAndPlay(0);
  await settle();
  service.audio.dispatchEvent(new Event("timeupdate"));
  service.seek(12);
  assert.equal(updates, 0, "the pre-roll clock is not the verse clock");
  assert.equal(service.audio.currentTime, 0, "seeking waits for the verse");

  service.audio.dispatchEvent(new Event("ended"));
  await playing;
  service.audio.dispatchEvent(new Event("timeupdate"));
  await settle();
  assert.ok(updates > 0, "timings resume with the verse");
  service.destroy();
});

test("a surah that already begins with the basmala plays without a pre-roll", async () => {
  const { service, seen } = harness([
    { surah: 1, ayah: 1, number: 1, hafsNumber: 1 },
  ]);
  await service.loadAndPlay(0);
  assert.deepEqual(seen, [`https://everyayah.com/data/${HUSARY}/001001.mp3`]);
  service.destroy();
});

test("At-Tawba starts on its first verse", async () => {
  const { service, seen } = harness([
    { surah: 9, ayah: 1, number: 1220, hafsNumber: 1 },
  ]);
  await service.loadAndPlay(0);
  assert.deepEqual(seen, [`https://everyayah.com/data/${HUSARY}/009001.mp3`]);
  service.destroy();
});

test("a verse after the first starts immediately", async () => {
  const { service, seen } = harness([
    { surah: 2, ayah: 1, number: 7, hafsNumber: 1 },
    { surah: 2, ayah: 2, number: 8, hafsNumber: 2 },
  ]);
  await service.loadAndPlay(1);
  assert.deepEqual(seen, [`https://everyayah.com/data/${HUSARY}/002002.mp3`]);
  service.destroy();
});

test("an unreachable basmala costs the reader nothing", async () => {
  const { service, seen } = harness([
    { surah: 2, ayah: 1, number: 7, hafsNumber: 1 },
  ]);
  const play = service.audio.play.bind(service.audio);
  service.audio.play = () =>
    service.audio.src === BASMALA
      ? Promise.reject(new Error("Audio load failed after retries"))
      : play();
  await service.loadAndPlay(0);
  assert.equal(
    seen[seen.length - 1],
    `https://everyayah.com/data/${HUSARY}/002001.mp3`,
    "the verse still plays",
  );
  assert.equal(service.isPlaying, true);
  service.destroy();
});

test("a playback request made during the basmala takes over the element", async () => {
  const { service, seen } = harness([
    { surah: 2, ayah: 1, number: 7, hafsNumber: 1 },
    { surah: 2, ayah: 2, number: 8, hafsNumber: 2 },
  ]);
  const first = service.loadAndPlay(0);
  await settle();
  const second = service.loadAndPlay(1);
  service.audio.dispatchEvent(new Event("ended"));
  await Promise.all([first, second]);
  await settle();
  assert.equal(service.playlistIndex, 1);
  assert.equal(seen[seen.length - 1], `https://everyayah.com/data/${HUSARY}/002002.mp3`);
  assert.equal(
    seen.filter((url) => url === BASMALA).length,
    1,
    "the abandoned pre-roll does not replay",
  );
  service.destroy();
});

test("a basmala that never advances cannot hold the surah hostage", async () => {
  // A mocked or stalled element resolves play() and then reports nothing: no
  // `ended`, no clock. The verse must still arrive.
  const { service, seen } = harness([
    { surah: 2, ayah: 1, number: 7, hafsNumber: 1 },
  ]);
  const playing = service.loadAndPlay(0);
  await new Promise((resolve) => setTimeout(resolve, 4500));
  await playing;
  assert.deepEqual(seen, [
    BASMALA,
    `https://everyayah.com/data/${HUSARY}/002001.mp3`,
  ]);
  assert.equal(service.playlistIndex, 0);
  service.destroy();
});

test("an opening file that is not a basmala never holds the verse", async () => {
  // Measured: AbdulSamad_64kbps_QuranExplorer.Com/001001.mp3 runs 67.2 s and
  // Ahmed_ibn_Ali_al-Ajamy_64kbps/001001.mp3 runs 39.2 s. Neither is the
  // four-word basmala, so the pre-roll must give up on them at once.
  for (const seconds of [67.2, 39.2]) {
    const { service, seen } = harness([
      { surah: 2, ayah: 1, number: 7, hafsNumber: 1 },
    ]);
    service.audio.duration = seconds;
    await service.loadAndPlay(0);
    assert.equal(seen[0], BASMALA, `${seconds}s file was still fetched`);
    assert.equal(
      seen[1],
      `https://everyayah.com/data/${HUSARY}/002001.mp3`,
      `${seconds}s file must not be waited on`,
    );
    assert.equal(service._basmala.active, false);
    service.destroy();
  }
});
