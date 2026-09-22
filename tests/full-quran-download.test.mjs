import assert from "node:assert/strict";
import test from "node:test";

const storedValues = new Map();
const cachedResponses = new Map();

globalThis.Audio = class {
  constructor() {
    this.paused = true;
  }
  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
  removeAttribute() {}
  pause() {}
  load() {}
};
globalThis.localStorage = {
  getItem: (key) => storedValues.get(key) ?? null,
  setItem: (key, value) => storedValues.set(key, String(value)),
  removeItem: (key) => storedValues.delete(key),
};
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.dispatchEvent = () => true;
globalThis.CustomEvent = class {
  constructor(type, options) {
    this.type = type;
    this.detail = options?.detail;
  }
};
globalThis.location = { href: "https://mushafplus.test/" };
globalThis.caches = {
  open: async () => ({
    match: async (key) => cachedResponses.get(String(key)),
    put: async (key, response) => cachedResponses.set(String(key), response),
    delete: async (key) => cachedResponses.delete(String(key)),
  }),
};
globalThis.fetch = async () => new Response(new Uint8Array([73, 68, 51]), {
  status: 200,
  headers: { "Content-Type": "audio/mpeg" },
});
let fetchCount = 0;
const baseFetch = globalThis.fetch;
globalThis.fetch = (...args) => {
  fetchCount += 1;
  return baseFetch(...args);
};
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: {
    connection: { effectiveType: "4g", saveData: false },
    storage: {
      estimate: async () => ({ usage: 0, quota: 10 * 1024 ** 3 }),
      persisted: async () => true,
      persist: async () => true,
    },
  },
});

const {
  downloadFullQuranForReciter,
  downloadSurahForReciter,
  getFullQuranDownloadSummary,
} = await import("../src/services/downloadService.js");
const { default: SURAHS } = await import("../src/data/surahs.js");
const { getReciter } = await import("../src/data/reciters.js");
const { getSurahVerseCountByRiwaya } = await import("../src/constants/warshSource.js");

// Synthetic: no catalogue entry streams whole surahs any more, but the
// mp3quran-surah download path must keep working for older cached voices.
const SURAH_STREAM_RECITER = {
  id: "synthetic_surah_stream",
  nameEn: "Synthetic Surah Stream",
  nameFr: "Flux sourate synthétique",
  style: "murattal",
  cdn: "https://server6.mp3quran.net/abkr/",
  cdnType: "mp3quran-surah",
  riwaya: "hafs",
  audioMode: "surah",
  source: "mp3quran",
  country: null,
  verifiedWarsh: false,
};

test("complete Quran downloads merge progress from concurrent workers", async () => {
  storedValues.clear();
  cachedResponses.clear();
  const reciter = SURAH_STREAM_RECITER;
  const result = await downloadFullQuranForReciter({ reciter, riwaya: "hafs" });
  const summary = getFullQuranDownloadSummary(reciter, "hafs");

  assert.equal(result, "done");
  assert.equal(summary.status, "done");
  assert.equal(summary.completedSurahs, 114);
  assert.equal(summary.percent, 100);
  assert.equal(cachedResponses.size, 114);
});

test("a Warsh surah is counted with the Warsh denominator", async () => {
  storedValues.clear();
  cachedResponses.clear();
  const reciter = getReciter("warsh_yassin", "warsh");
  // Al-Ma'ida: 120 Hafs verses, 122 Warsh verses.
  const surahMeta = SURAHS.find((surah) => surah.n === 5);
  assert.equal(surahMeta.ayahs, 120);

  const status = await downloadSurahForReciter({
    surahMeta,
    reciter,
    riwaya: "warsh",
  });
  const entry = JSON.parse(
    localStorage.getItem("mushaf_offline_progress_v2"),
  )[`warsh:${reciter.id}:5`];

  assert.equal(status, "done");
  assert.equal(entry.total, getSurahVerseCountByRiwaya(5, "warsh"));
  assert.equal(entry.downloaded, entry.total);
  // The extra Warsh verses share their Hafs file, so fewer URLs are stored.
  assert.equal(cachedResponses.size, 120);
});

test("a lost connection parks the surah instead of failing every verse", async () => {
  storedValues.clear();
  cachedResponses.clear();
  fetchCount = 0;
  const reciter = getReciter("warsh_yassin", "warsh");
  navigator.onLine = false;
  try {
    const status = await downloadSurahForReciter({
      surahMeta: SURAHS.find((surah) => surah.n === 103),
      reciter,
      riwaya: "warsh",
    });
    const entry = JSON.parse(
      localStorage.getItem("mushaf_offline_progress_v2"),
    )[`warsh:${reciter.id}:103`];

    assert.equal(status, "partial");
    assert.equal(entry.status, "partial");
    assert.equal(entry.downloaded, 0);
    assert.equal(fetchCount, 0, "an offline worker must not queue doomed requests");
  } finally {
    delete navigator.onLine;
  }
});
