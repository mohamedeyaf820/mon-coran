import test from "node:test";
import assert from "node:assert/strict";

import {
  getAvailableTafsirs,
  getVerseTafsir,
} from "../src/services/quranComStudyService.js";

function mockTafsirFetch(handler) {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url) => handler(String(url));
  return () => {
    globalThis.fetch = previousFetch;
  };
}

test("tafsir: exposes stable keys for selector values", () => {
  const sources = getAvailableTafsirs();
  const kathir = sources.find((source) => source.key === "en-kathir");
  assert.equal(kathir.id, 169);
  assert.equal(kathir.lang, "en");
});

test("tafsir: accepts numeric resource ids and keeps selected source", async () => {
  const restore = mockTafsirFetch(async (url) => {
    assert.match(url, /\/tafsirs\/14\/by_ayah\/2%3A255$/);
    return {
      ok: true,
      async json() {
        return { tafsir: { text: "<p>Arabic Ibn Kathir text</p>" } };
      },
    };
  });

  try {
    const result = await getVerseTafsir({
      surah: 2,
      ayah: 255,
      lang: "ar",
      tafsirId: 14,
    });
    assert.equal(result.tafsirId, "ar-kathir");
    assert.equal(result.text, "Arabic Ibn Kathir text");
  } finally {
    restore();
  }
});

test("tafsir: falls back when the selected resource fails", async () => {
  const calls = [];
  const restore = mockTafsirFetch(async (url) => {
    calls.push(url);
    if (url.includes("/tafsirs/90/")) {
      return { ok: false, status: 404 };
    }
    return {
      ok: true,
      async json() {
        return { tafsir: { text: "<p>Fallback tafsir</p>" } };
      },
    };
  });

  try {
    const result = await getVerseTafsir({
      surah: 1,
      ayah: 1,
      lang: "fr",
      tafsirId: "ar-qurtubi",
    });
    assert.equal(result.text, "Fallback tafsir");
    assert.equal(result.tafsirId, "fr-mukhtasar");
    assert.equal(result.note, null);
    assert.equal(calls.length, 2);
  } finally {
    restore();
  }
});

const PREFIX = "mushafplus:tafsir:v2:";
const MAX = 240;

function makeStorage(entries = [], limit = Infinity) {
  const map = new Map(entries);
  return {
    map,
    get length() {
      return map.size;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      if (map.size >= limit && !map.has(key)) {
        throw Object.assign(new Error("quota"), { name: "QuotaExceededError" });
      }
      map.set(key, value);
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

async function withStorage(storage, run) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  try {
    await run();
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
}

function cachedKeys(storage) {
  return [...storage.map.keys()].filter(
    (key) => key.startsWith(PREFIX) && key !== `${PREFIX}index`,
  );
}

function mockTafsirText() {
  return mockTafsirFetch(async () => ({
    ok: true,
    async json() {
      return { tafsir: { text: "<p>Some tafsir body</p>" } };
    },
  }));
}

test("tafsir cache: stays bounded and drops the oldest verse first", async () => {
  const storage = makeStorage();
  const restore = mockTafsirText();
  try {
    await withStorage(storage, async () => {
      for (let ayah = 1; ayah <= MAX + 20; ayah += 1) {
        await getVerseTafsir({ surah: 2, ayah, lang: "ar", tafsirId: "ar-muyassar" });
      }
    });
  } finally {
    restore();
  }
  const keys = cachedKeys(storage);
  assert.equal(keys.length, MAX);
  assert.equal(keys.includes(`${PREFIX}16:2:1`), false);
  assert.equal(keys.includes(`${PREFIX}16:2:${MAX + 20}`), true);
});

test("tafsir cache: a full store trims itself instead of losing the fetch", async () => {
  const storage = makeStorage([], MAX + 4);
  const restore = mockTafsirText();
  let thrown = null;
  try {
    await withStorage(storage, async () => {
      for (let ayah = 1; ayah <= MAX + 30; ayah += 1) {
        try {
          await getVerseTafsir({ surah: 2, ayah, lang: "ar", tafsirId: "ar-muyassar" });
        } catch (error) {
          thrown = error;
        }
      }
    });
  } finally {
    restore();
  }
  assert.equal(thrown, null);
  assert.ok(cachedKeys(storage).length <= MAX);
});

test("tafsir cache: an unbounded cache from an earlier version is swept once", async () => {
  const legacy = Array.from({ length: MAX + 300 }, (_, i) => [
    `${PREFIX}16:2:${i + 1}`,
    JSON.stringify({ text: "old", savedAt: 1 }),
  ]);
  const storage = makeStorage(legacy);
  const restore = mockTafsirText();
  try {
    await withStorage(storage, async () => {
      await getVerseTafsir({ surah: 2, ayah: 5, lang: "ar", tafsirId: "ar-muyassar" });
    });
  } finally {
    restore();
  }
  assert.ok(cachedKeys(storage).length <= MAX);
});
