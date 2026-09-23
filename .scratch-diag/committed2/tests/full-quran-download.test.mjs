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
