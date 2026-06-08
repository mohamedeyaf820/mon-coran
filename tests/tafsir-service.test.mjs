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
    assert.match(url, /\/tafsirs\/14\/by_ayah\/2:255$/);
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
    assert.equal(result.tafsirId, "en-kathir");
    assert.match(result.note, /fran/);
    assert.equal(calls.length, 2);
  } finally {
    restore();
  }
});
