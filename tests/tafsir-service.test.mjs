import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  getAvailableTafsirs,
  getVerseTafsir,
} from "../src/services/quranComStudyService.js";
import { FRENCH_TAFSIR_EDITION_ID } from "../src/services/frenchTafsirService.js";

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
  // A French source now exists: the vendored Al-Mukhtasar edition, flagged local
  // so it routes away from the Quran.com HTTP path. The dead resource 816 (which
  // Quran.com answered 503 for) must never return.
  const french = sources.find((source) => source.lang === "fr");
  assert.equal(french?.key, FRENCH_TAFSIR_EDITION_ID);
  assert.equal(french?.local, true);
  assert.equal(sources.some((source) => source.id === 816), false);
  // The Warsh reader is pointed at the sources that record the readings.
  assert.deepEqual(
    sources.filter((source) => source.qiraat).map((source) => source.key).sort(),
    ["ar-baghawi", "ar-qurtubi", "ar-tabari"],
  );
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
    // The local French edition reaches for its index asset here; with no array
    // buffer on this stub it rejects and the chain moves on, exactly as a
    // missing offline corpus would.
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
    // A French reader who lands on a non-French source is told the French
    // commentary exists as an alternative, rather than being left guessing.
    assert.match(result.note, /Aucun commentaire français/);
    assert.match(result.note, /Al-Mukhtasar/);
    assert.ok(calls.some((url) => url.includes("/tafsirs/169/")));
  } finally {
    restore();
  }
});

const QURANENC_URL = /^https:\/\/quranenc\.com\/api\/v1\/translation\/sura\/french_mokhtasar\/(\d+)$/;

async function quranEncFixture(surah) {
  const name = `quranenc-french-mokhtasar-${String(surah).padStart(3, "0")}.json`;
  return JSON.parse(await readFile(path.join("tests", "fixtures", name), "utf8"));
}

// Answers the QuranEnc surah endpoint with real captured responses (sura 1 and
// 114) or with a payload built by `override(surah, payload)`.
function mockQuranEnc({ override } = {}) {
  const calls = [];
  const restore = mockTafsirFetch(async (url) => {
    const match = QURANENC_URL.exec(url);
    assert.ok(match, `expected a QuranEnc French tafsir request, got ${url}`);
    const surah = Number(match[1]);
    calls.push(surah);
    const payload = override ? override(surah, await quranEncFixture(surah)) : await quranEncFixture(surah);
    return { ok: true, async json() { return payload; } };
  });
  return { calls, restore };
}

test("tafsir: serves the French edition from the QuranEnc API and reuses the surah", async () => {
  const { clearFrenchTafsirCache } = await import("../src/services/frenchTafsirService.js");
  await clearFrenchTafsirCache();
  const { calls, restore } = mockQuranEnc();
  try {
    const result = await getVerseTafsir({
      surah: 114,
      ayah: 1,
      lang: "fr",
      tafsirId: FRENCH_TAFSIR_EDITION_ID,
    });
    assert.equal(result.tafsirId, FRENCH_TAFSIR_EDITION_ID);
    assert.equal(result.language, "fr");
    assert.equal(result.note, null, "a French reader on the French source gets no language warning");
    assert.ok(typeof result.text === "string" && result.text.length > 10);
    assert.ok(!result.text.includes("`"), "displayed text carries no markdown backticks");

    // A second verse of the same surah is answered without another request.
    await getVerseTafsir({ surah: 114, ayah: 2, lang: "fr", tafsirId: FRENCH_TAFSIR_EDITION_ID });
    assert.deepEqual(calls, [114]);
  } finally {
    restore();
  }
});

test("tafsir: refuses an incomplete or empty French surah instead of showing half a corpus", async () => {
  const { clearFrenchTafsirCache, getFrenchTafsirVerse } = await import(
    "../src/services/frenchTafsirService.js"
  );
  await clearFrenchTafsirCache();

  const missingVerse = mockQuranEnc({
    override: (_surah, payload) => ({ result: payload.result.slice(0, -1) }),
  });
  try {
    await assert.rejects(() => getFrenchTafsirVerse({ surah: 1, ayah: 1 }), /Incomplete French tafsir/);
  } finally {
    missingVerse.restore();
  }

  const emptyVerse = mockQuranEnc({
    override: (_surah, payload) => ({
      result: payload.result.map((row, i) => (i === 3 ? { ...row, translation: "  " } : row)),
    }),
  });
  try {
    await assert.rejects(() => getFrenchTafsirVerse({ surah: 1, ayah: 1 }), /Invalid French tafsir row/);
  } finally {
    emptyVerse.restore();
  }
});

test("tafsir: a French surah the API cannot deliver falls back to another source", async () => {
  const { clearFrenchTafsirCache } = await import("../src/services/frenchTafsirService.js");
  await clearFrenchTafsirCache();
  const restore = mockTafsirFetch(async (url) => {
    if (url.includes("quranenc.com")) return { ok: false, status: 503 };
    return { ok: true, async json() { return { tafsir: { text: "<p>Fallback tafsir</p>" } }; } };
  });
  try {
    const result = await getVerseTafsir({
      surah: 1,
      ayah: 1,
      lang: "fr",
      tafsirId: FRENCH_TAFSIR_EDITION_ID,
    });
    assert.equal(result.tafsirId, "en-kathir");
    assert.match(result.note, /Aucun commentaire français/);
  } finally {
    restore();
  }
});

test("tafsir: the French edition is attributed to its publisher and to QuranEnc", async () => {
  const { getFrenchTafsirAttribution } = await import("../src/services/frenchTafsirService.js");
  const info = await getFrenchTafsirAttribution();
  assert.equal(info.source.owner, "quranenc.com");
  assert.equal(info.source.slug, "french_mokhtasar");
  assert.ok(info.source.version, "the edition version is recorded");
  assert.match(info.attribution, /QuranEnc\.com/);
  assert.match(info.attribution, /Tafsir Center for Quranic Studies/);
  assert.doesNotMatch(info.attribution, /Awqaf/i);
});

test("tafsir: the display cleanup removes markdown artifacts and nothing else", async () => {
  const { toDisplayText } = await import("../src/services/frenchTafsirService.js");
  assert.equal(
    toDisplayText("à savoir:\n- `Allâhu, La Divinité.  - `Ar-Raḥmânu, Celui.  \n"),
    "à savoir:\nAllâhu, La Divinité. - Ar-Raḥmânu, Celui.",
  );
  assert.equal(toDisplayText(null), "");
  assert.equal(toDisplayText("Texte sans artefact."), "Texte sans artefact.");
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
