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

const { getReciter } = await import("../src/data/reciters.js");
const {
  downloadFullQuranForReciter,
  getFullQuranDownloadSummary,
  cancelFullQuranDownload,
  isFullQuranDownloadActive,
  removeFullQuranCacheForReciter,
  downloadSurahForReciter,
  getSurahDownloadEntry,
} = await import("../src/services/downloadService.js");

test("complete Quran downloads merge progress from concurrent workers", async () => {
  storedValues.clear();
  cachedResponses.clear();
  const reciter = getReciter("idris_abkar", "hafs");
  const result = await downloadFullQuranForReciter({ reciter, riwaya: "hafs" });
  const summary = getFullQuranDownloadSummary(reciter, "hafs");

  assert.equal(result, "done");
  assert.equal(summary.status, "done");
  assert.equal(summary.completedSurahs, 114);
  assert.equal(summary.percent, 100);
  assert.equal(cachedResponses.size, 114);
});

test("full Quran startup owns cancellation and rejects duplicate starts during reconciliation", async () => {
  storedValues.clear();
  cachedResponses.clear();
  const originalOpen = caches.open;
  let release;
  caches.open = () => new Promise(resolve => { release = () => resolve(originalOpen()); });
  const reciter = getReciter("idris_abkar", "hafs");
  try {
    const pending = downloadFullQuranForReciter({ reciter });
    assert.equal(isFullQuranDownloadActive(reciter.id), true);
    assert.equal(await downloadFullQuranForReciter({ reciter }), "partial");
    assert.equal(cancelFullQuranDownload(reciter.id), true);
    release();
    assert.equal(await pending, "cancelled");
    assert.equal(isFullQuranDownloadActive(reciter.id), false);
    assert.equal(cachedResponses.size, 0);
    assert.equal(storedValues.size, 0);
  } finally { caches.open = originalOpen; }
});

test("removal waits for quota startup and prevents new downloads until cleaned", async () => {
  storedValues.clear();
  cachedResponses.clear();
  const originalEstimate = navigator.storage.estimate;
  let release;
  let entered;
  const quotaEntered = new Promise(resolve => { entered = resolve; });
  navigator.storage.estimate = () => new Promise(resolve => {
    release = () => resolve({ usage: 0, quota: 10 * 1024 ** 3 });
    entered();
  });
  const reciter = getReciter("idris_abkar", "hafs");
  try {
    const pending = downloadFullQuranForReciter({ reciter });
    await quotaEntered;
    const removing = removeFullQuranCacheForReciter({ reciter });
    assert.equal(await downloadFullQuranForReciter({ reciter }), "cancelled");
    release();
    assert.equal(await pending, "cancelled");
    await removing;
    assert.equal(cachedResponses.size, 0);
    assert.equal(getFullQuranDownloadSummary(reciter).downloadedItems, 0);
  } finally { navigator.storage.estimate = originalEstimate; }
});

test("actual Cache Storage quota errors are storage-full, including full Quran workers", async () => {
  storedValues.clear();
  cachedResponses.clear();
  const originalOpen = caches.open;
  caches.open = async () => ({
    ...await originalOpen(),
    put: async () => { throw new DOMException("Quota exhausted", "QuotaExceededError"); },
  });
  const reciter = getReciter("idris_abkar", "hafs");
  try {
    assert.equal(await downloadSurahForReciter({ surahMeta: { n: 1, ayahs: 7 }, reciter }), "storage-full");
    assert.equal(getSurahDownloadEntry(1, reciter.id, "hafs").downloaded, 0);
    assert.equal(await downloadFullQuranForReciter({ reciter }), "storage-full");
    assert.equal(isFullQuranDownloadActive(reciter.id), false);
  } finally { caches.open = originalOpen; }
});
