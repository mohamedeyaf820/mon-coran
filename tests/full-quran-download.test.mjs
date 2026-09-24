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
    keys: async () => [...cachedResponses.keys()].map((url) => ({ url })),
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
  removeSurahCacheForReciter,
  verifyFullQuranDownloadForReciter,
  verifySurahDownloadForReciter,
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

test("a missing audio file revokes offline status and can be repaired", async () => {
  storedValues.clear();
  cachedResponses.clear();
  const reciter = SURAH_STREAM_RECITER;
  const surahMeta = SURAHS[0];
  assert.equal(await downloadSurahForReciter({ surahMeta, reciter }), "done");
  const [missingUrl] = cachedResponses.keys();
  cachedResponses.delete(missingUrl);

  const checked = await verifySurahDownloadForReciter({ surahMeta, reciter });
  assert.equal(checked.status, "partial");
  assert.equal(checked.downloaded, 0);
  assert.equal(await downloadSurahForReciter({ surahMeta, reciter }), "done");
  assert.equal((await verifySurahDownloadForReciter({ surahMeta, reciter })).status, "done");
});

test("a complete download resumes if one stored surah disappears", async () => {
  storedValues.clear();
  cachedResponses.clear();
  const reciter = SURAH_STREAM_RECITER;
  assert.equal(await downloadFullQuranForReciter({ reciter }), "done");
  const missingUrl = [...cachedResponses.keys()].find((url) => url.endsWith("/002.mp3"));
  assert.ok(missingUrl);
  cachedResponses.delete(missingUrl);

  const checked = await verifyFullQuranDownloadForReciter({ reciter });
  assert.equal(checked.status, "partial");
  assert.equal(checked.completedSurahs, 113);
  assert.equal(await downloadFullQuranForReciter({ reciter }), "done");
  assert.equal(cachedResponses.size, 114);
});

test("a Warsh download caches exactly the files the Warsh player asks for", async () => {
  const { AudioService } = await import("../src/services/audioService.js");
  const { buildSurahAudioPlaylist, expandAyahsToAudioFiles } = await import("../src/utils/audioPlaylist.js");

  for (const surahNumber of [2, 5]) {
    storedValues.clear();
    cachedResponses.clear();
    const reciter = getReciter("warsh_yassin", "warsh");
    const surahMeta = SURAHS.find((surah) => surah.n === surahNumber);

    const status = await downloadSurahForReciter({
      surahMeta,
      reciter,
      riwaya: "warsh",
    });
    const entry = JSON.parse(
      localStorage.getItem("mushaf_offline_progress_v2"),
    )[`warsh:${reciter.id}:${surahNumber}`];

    assert.equal(status, "done", `surah ${surahNumber}`);
    // Al-Ma'ida shows 122 Warsh verses over 120 files; Al-Baqara shows 285 over
    // 286. The denominator is what the downloader actually fetches — which
    // includes the basmala the player pre-rolls ahead of verse 1.
    const { basmalaPrerollUrl } = await import(
      "../src/services/audioUrlBuilder.js"
    );
    const playerUrls = new Set(
      expandAyahsToAudioFiles(buildSurahAudioPlaylist(surahNumber, "warsh"), "everyayah").map((item) => AudioService.buildUrl(reciter.cdn, item, "everyayah")),
    );
    playerUrls.add(basmalaPrerollUrl(reciter.cdn, "everyayah", surahNumber));
    assert.equal(entry.total, playerUrls.size, `surah ${surahNumber} file count`);
    assert.equal(entry.downloaded, entry.total, "the bar reaches 100 %");
    for (const url of playerUrls) {
      assert.ok(cachedResponses.has(url), `${url} must be cached for offline play`);
    }
    // Hafs verses outnumbering files, and files outnumbering verses, are both
    // covered: nothing is fetched twice and nothing is missed.
    assert.equal(
      playerUrls.size,
      new Set([...playerUrls].map((url) => url.split("/").pop())).size,
    );
  }
  assert.ok(getSurahVerseCountByRiwaya(5, "warsh") > 120, "Al-Ma'ida still shows 122 verses");
});

test("removing one surah keeps a shared basmala needed by another", async () => {
  storedValues.clear();
  cachedResponses.clear();
  const reciter = getReciter("warsh_yassin", "warsh");
  const first = SURAHS.find((surah) => surah.n === 103);
  const second = SURAHS.find((surah) => surah.n === 112);
  assert.equal(await downloadSurahForReciter({ surahMeta: first, reciter, riwaya: "warsh" }), "done");
  assert.equal(await downloadSurahForReciter({ surahMeta: second, reciter, riwaya: "warsh" }), "done");
  await removeSurahCacheForReciter({ surahMeta: first, reciter, riwaya: "warsh" });
  assert.equal(
    (await verifySurahDownloadForReciter({ surahMeta: second, reciter, riwaya: "warsh" })).status,
    "done",
  );
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
