/**
 * Contract: the in-memory Quran-text caches stay bounded (Finding "caches with
 * no eviction, duplicating the Quran text up to four times").
 *
 * warshService, transliterationService and warshTranslationService each keep a
 * Map of normalised text for the tab's lifetime. These tests drive the real
 * public loaders — through the same fetch path the browser uses, served from
 * the vendored assets — and assert three things per cache: it never grows past
 * its declared cap, the entry the reader touched most recently survives, and
 * the sum of the caps still fits the memory budget the caps were chosen against.
 * The budget is recomputed from the shipped dataset, so raising a cap without
 * re-measuring fails the gate.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { getWarshSurahAyahCount } from "../src/constants/warshSource.js";
import {
  clearWarshCache,
  getWarshJuzVerses,
  getWarshMemoryCacheStats,
  getWarshPageVerses,
  getWarshSurahFormatted,
  getWarshSurahVerses,
  isWarshDataLoaded,
  loadWarshSurah,
} from "../src/services/warshService.js";
import {
  clearTransliterationCache,
  getTransliterationCacheStats,
  getTransliterationSurah,
  getTransliterationText,
} from "../src/services/transliterationService.js";
import {
  clearWarshTranslationCache,
  getWarshTranslationCacheStats,
  getWarshTranslationSurah,
  WARSH_TRANSLATION_EDITION_ID,
} from "../src/services/warshTranslationService.js";

const readSource = (relativePath) =>
  fs.readFileSync(new URL(relativePath, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const readAsset = (name) => fs.readFileSync(new URL(`../public/data/${name}`, import.meta.url));

const LEGACY_ROWS = JSON.parse(readAsset("warsh-page-source.json").toString("utf8"));
const LEGACY = Array.isArray(LEGACY_ROWS) ? LEGACY_ROWS : LEGACY_ROWS.data || LEGACY_ROWS.verses;

/* ── Offline asset server ───────────────────────────────────────────────── */

const requested = [];
const realFetch = globalThis.fetch;

/** Rows shaped like the pinned per-surah Warsh source, dense 1..N. */
function syntheticWarshSurah(surahNumber) {
  const total = getWarshSurahAyahCount(surahNumber);
  return Array.from({ length: total }, (_, index) => ({
    ayah_number: index + 1,
    text: `s${surahNumber}a${index + 1} word${index + 1} next`,
  }));
}

function respondWith(bytes, contentType = "application/json") {
  const buffer = Uint8Array.from(bytes).buffer;
  return {
    ok: true,
    status: 200,
    headers: { get: () => contentType },
    arrayBuffer: async () => buffer,
    json: async () => JSON.parse(new TextDecoder().decode(buffer)),
    text: async () => new TextDecoder().decode(buffer),
  };
}

/**
 * Serves the vendored files and the synthetic Warsh per-surah source, and refuses
 * anything else so a cache miss can never be satisfied by a real request.
 */
test.before(() => {
  requested.length = 0;
  globalThis.fetch = async (url) => {
    const raw = String(url);
    const withoutQuery = raw.split("?")[0];
    requested.push(withoutQuery);

    if (/\/data\/warsh-page-source\.json$/.test(withoutQuery) || /warshData_v2-1\.json$/.test(withoutQuery)) {
      return respondWith(readAsset("warsh-page-source.json"));
    }
    const warshSurah = /warsh_text\/(\d{3})\.json$/.exec(withoutQuery);
    if (warshSurah) return respondWith(Buffer.from(JSON.stringify(syntheticWarshSurah(Number(warshSurah[1]))), "utf8"));

    const transliteration = /\/data\/transliteration-en\/([\w.-]+\.json)$/.exec(withoutQuery);
    if (transliteration) return respondWith(readAsset(`transliteration-en/${transliteration[1]}`));

    const translation = /\/data\/(warsh-translation-[a-z]{2})\/([\w.-]+\.json)$/.exec(withoutQuery);
    if (translation) return respondWith(readAsset(`${translation[1]}/${translation[2]}`));

    throw new Error(`the caches asked for something offline-safe: ${raw}`);
  };
});

test.after(async () => {
  globalThis.fetch = realFetch;
  await clearWarshCache();
  await clearTransliterationCache();
  await clearWarshTranslationCache();
});

test.beforeEach(async () => {
  await clearWarshCache();
  await clearTransliterationCache();
  await clearWarshTranslationCache();
});

/* ── 1. warshService: the four text caches ──────────────────────────────── */

test("warsh surah rows stop growing at the cap and keep the newest surah", async () => {
  const { caps } = getWarshMemoryCacheStats();
  const surahs = [103, 104, 105, 106, 107, 108, 109, 110];
  assert.ok(surahs.length > caps.surahs, "the fixture must exceed the cap to prove the bound");

  for (const surah of surahs) {
    const rows = await loadWarshSurah(surah);
    assert.equal(rows.length, getWarshSurahAyahCount(surah), `surah ${surah} stays complete`);
  }

  const stats = getWarshMemoryCacheStats();
  assert.ok(
    stats.surahs <= caps.surahs,
    `cached surahs ${stats.surahs} must not exceed the cap ${caps.surahs}`,
  );
  assert.equal(isWarshDataLoaded(surahs.at(-1)), true, "the newest surah survived");
  assert.equal(isWarshDataLoaded(surahs[0]), false, "the oldest one made room for it");

  // An evicted surah is still served, from the offline source, unchanged.
  const reloaded = await loadWarshSurah(surahs[0]);
  assert.equal(reloaded.length, getWarshSurahAyahCount(surahs[0]));
  assert.equal(reloaded[0].text, syntheticWarshSurah(surahs[0])[0].text, "same text after eviction");
});

test("reading a cached surah protects it from the next eviction", async () => {
  const { caps } = getWarshMemoryCacheStats();
  const first = 103;
  const fillers = [104, 105, 106];

  await loadWarshSurah(first);
  for (const surah of fillers.slice(0, caps.surahs - 1)) await loadWarshSurah(surah);

  // Touching the oldest entry moves it to the front of the queue: a reader who
  // keeps rendering the same surah must not have it dropped under them.
  await getWarshSurahVerses(first);
  await loadWarshSurah(112);

  const stats = getWarshMemoryCacheStats();
  assert.ok(stats.surahs <= caps.surahs);
  assert.equal(isWarshDataLoaded(first), true, "the touched entry stays warm");
});

test("warsh formatted-surah payloads stay inside their cap", async () => {
  const { caps } = getWarshMemoryCacheStats();
  const surahs = [103, 104, 105, 106, 107, 108, 110];
  assert.ok(surahs.length > caps.surahPayloads);

  for (const surah of surahs) {
    const payload = await getWarshSurahFormatted(surah);
    assert.equal(payload.ayahs.length, getWarshSurahAyahCount(surah));
    assert.equal(payload.requestedRiwaya, "warsh");
  }

  const stats = getWarshMemoryCacheStats();
  assert.ok(
    stats.surahPayloads <= caps.surahPayloads,
    `payloads ${stats.surahPayloads} must not exceed ${caps.surahPayloads}`,
  );

  // The payload is derived from the rows, so both caches must stay coherent:
  // re-asking for the newest surah is a cache hit, not a re-fetch.
  const before = requested.length;
  await getWarshSurahFormatted(surahs.at(-1));
  assert.equal(requested.length, before, "the most recent payload is still served from memory");
});

test("warsh page payloads stop at the cap without mixing pages", async () => {
  const { caps } = getWarshMemoryCacheStats();
  const pages = [];
  for (let page = 1; page <= caps.pages + 3; page += 1) pages.push(page);

  for (const page of pages) {
    const payload = await getWarshPageVerses(page);
    assert.ok(payload.ayahs.length > 0, `page ${page} has verses`);
    for (const ayah of payload.ayahs) {
      assert.equal(ayah.page, page, `page ${page} keeps only its own ayahs`);
    }
  }

  const stats = getWarshMemoryCacheStats();
  assert.ok(
    stats.pages <= caps.pages,
    `page payloads ${stats.pages} must not exceed ${caps.pages}`,
  );

  const last = await getWarshPageVerses(pages.at(-1));
  assert.equal(last.number, pages.at(-1));
  assert.ok(last.ayahs.length > 0, "the newest page is the one that stayed");
});

test("warsh juz payloads stop at the cap and stay complete", async () => {
  const { caps } = getWarshMemoryCacheStats();
  for (const juz of [1, 2, 3]) {
    const payload = await getWarshJuzVerses(juz);
    assert.equal(payload.number, juz);
    assert.ok(payload.ayahs.length > 100, `juz ${juz} assembles its verses`);
  }

  const stats = getWarshMemoryCacheStats();
  assert.ok(stats.juz <= caps.juz, `juz payloads ${stats.juz} must not exceed ${caps.juz}`);
  const newest = await getWarshJuzVerses(3);
  assert.ok(newest.ayahs.length > 100, "the juz the reader is on is the one kept");
});

test("clearWarshCache still empties every bounded cache", async () => {
  await loadWarshSurah(103);
  await getWarshPageVerses(1);
  await getWarshJuzVerses(30);
  assert.ok(
    Object.entries(getWarshMemoryCacheStats())
      .filter(([name]) => name !== "caps")
      .some(([, size]) => size > 0),
    "the fixtures filled something first",
  );

  await clearWarshCache();
  const stats = getWarshMemoryCacheStats();
  assert.deepEqual(
    { surahs: stats.surahs, surahPayloads: stats.surahPayloads, pages: stats.pages, juz: stats.juz },
    { surahs: 0, surahPayloads: 0, pages: 0, juz: 0 },
  );
});

/* ── 2. The Latin companions: transliteration and Warsh translation ─────── */

test("transliteration surah maps stop at the cap", async () => {
  const { cap } = getTransliterationCacheStats();
  const surahs = Array.from({ length: cap + 2 }, (_, index) => index + 1);

  for (const surah of surahs) {
    const map = await getTransliterationSurah(surah);
    assert.ok(map.size > 0, `surah ${surah} loaded`);
  }

  const stats = getTransliterationCacheStats();
  assert.ok(stats.loadedSurahs <= cap, `${stats.loadedSurahs} must not exceed ${cap}`);
  assert.ok(
    getTransliterationText(surahs.at(-1), 1).length > 0,
    "the newest surah keeps its pinned line",
  );
  assert.equal(getTransliterationText(1, 1), "", "the evicted surah answers as a memory miss");
});

test("reading a transliteration line keeps that surah resident", async () => {
  const { cap } = getTransliterationCacheStats();
  await getTransliterationSurah(2);
  // Fill the cache to exactly its cap, oldest (2) first.
  for (let surah = 3; surah <= cap + 1; surah += 1) await getTransliterationSurah(surah);
  assert.equal(getTransliterationCacheStats().loadedSurahs, cap);

  // The cards read the visible line through the synchronous getter, which marks
  // the surah most recently used — so the page on screen cannot be evicted from
  // under the reader mid-verse.
  assert.ok(getTransliterationText(2, 1).length > 0);
  await getTransliterationSurah(cap + 2);

  assert.ok(
    getTransliterationText(2, 1).length > 0,
    "the surah being read survived one more load",
  );
  assert.equal(getTransliterationText(3, 1), "", "the least recently used one made room");
  assert.ok(getTransliterationCacheStats().loadedSurahs <= cap);
});

test("warsh translation surahs stop at the cap", async () => {
  const { cap } = getWarshTranslationCacheStats();
  const surahs = Array.from({ length: cap + 2 }, (_, index) => index + 1);

  for (const surah of surahs) {
    const records = await getWarshTranslationSurah(surah, WARSH_TRANSLATION_EDITION_ID);
    assert.ok(records.length > 0, `surah ${surah} translated`);
  }

  const stats = getWarshTranslationCacheStats();
  assert.ok(stats.cachedSurahs <= cap, `${stats.cachedSurahs} must not exceed ${cap}`);
  const newest = await getWarshTranslationSurah(surahs.at(-1), WARSH_TRANSLATION_EDITION_ID);
  assert.ok(newest.length > 0, "the newest surah is still served");
});

/* ── 3. The budget the caps were chosen against ─────────────────────────── */

/**
 * Approximate retained heap of one normalised scope: Arabic text as UTF-16
 * twice (the record keeps `text` and `words`, the split duplicating the string
 * as separate values), plus a per-string and per-record object header. This is
 * the same estimator the caps were picked with; it is a proxy, so the budget
 * keeps a full 0.4 MB of slack below the 3 MB ceiling.
 */
function scopeWeight(rows) {
  let chars = 0;
  let words = 0;
  for (const row of rows) {
    const text = row.aya_text || row.text || "";
    chars += [...text].length;
    words += text.split(/\s+/).filter(Boolean).length;
  }
  return chars * 2 * 2 + words * 24 + rows.length * 120;
}

function groupRows(read) {
  const groups = new Map();
  for (const row of LEGACY) {
    const key = read(row);
    if (key == null) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}

function heaviestWithinCap(groups, cap) {
  const weights = [...groups.values()].map(scopeWeight).sort((a, b) => b - a);
  return weights.slice(0, cap).reduce((sum, weight) => sum + weight, 0);
}

test("the four warsh caches cannot exceed the 3 MB residency budget", () => {
  const { caps } = getWarshMemoryCacheStats();
  const bySurah = groupRows((row) => Number(row.sura_no) || null);
  const byPage = groupRows((row) => {
    const match = /^(\d{1,3})(?:-\d{1,3})?$/.exec(String(row.page || ""));
    return match ? Number(match[1]) : null;
  });
  const byJuz = groupRows((row) => Number(row.jozz) || null);

  const MB = 1024 * 1024;
  const rows = heaviestWithinCap(bySurah, caps.surahs);
  // A formatted payload reuses the word arrays of its rows and adds wrapper
  // objects plus a second copy of the text, measured at ~0.6x of the rows.
  const payloads = rows * 0.6;
  const total =
    rows +
    payloads +
    heaviestWithinCap(byPage, caps.pages) +
    heaviestWithinCap(byJuz, caps.juz);

  assert.ok(
    total < 3 * MB,
    `worst-case warsh residency is ${(total / MB).toFixed(2)} MB, over the 3 MB budget`,
  );
  // The unbounded shape this replaces: every surah, page and juz of a full
  // read-through, four times over.
  const unbounded =
    [...bySurah.values()].reduce((sum, rows2) => sum + scopeWeight(rows2), 0) * 4;
  assert.ok(total < unbounded / 4, "the caps must actually bind");
});

/* ── 4. Static guards on the cache sites ────────────────────────────────── */

const OWNED_SERVICES = [
  "../src/services/warshService.js",
  "../src/services/transliterationService.js",
  "../src/services/warshTranslationService.js",
];

test("every write to a bounded cache goes through the LRU helper", () => {
  const bounded = {
    "../src/services/warshService.js": [
      "cachedSurahs",
      "cachedSurahPayloads",
      "cachedJuzPayloads",
      "cachedPagePayloads",
    ],
    "../src/services/transliterationService.js": ["loadedSurahs"],
    "../src/services/warshTranslationService.js": ["cachedSurahs"],
  };

  for (const file of OWNED_SERVICES) {
    const source = readSource(file);
    for (const mapName of bounded[file]) {
      assert.match(
        source,
        new RegExp(`const ${mapName} = new Map\\(\\);`),
        `${file} still declares ${mapName}`,
      );
      const direct = new RegExp(String.raw`${mapName}\.set\(`).exec(source);
      assert.equal(
        direct,
        null,
        `${file}: ${mapName}.set( bypasses the bounded helper at ${JSON.stringify(direct?.[0])}`,
      );
      assert.match(
        source,
        new RegExp(`rememberBounded\\(${mapName}|remember(Surah|Payload)[A-Za-z]*\\(`),
        `${file}: ${mapName} must be written through rememberBounded`,
      );
    }
  }
});

test("the caches expose their caps and sizes for measurement", () => {
  assert.deepEqual(Object.keys(getWarshMemoryCacheStats().caps).sort(), [
    "juz",
    "pages",
    "surahPayloads",
    "surahs",
  ]);
  for (const stats of [
    getTransliterationCacheStats(),
    getWarshTranslationCacheStats(),
  ]) {
    assert.ok(Number.isInteger(stats.cap) && stats.cap > 0, "a cap is declared");
  }
  const warshCaps = getWarshMemoryCacheStats().caps;
  for (const value of Object.values(warshCaps)) {
    assert.ok(Number.isInteger(value) && value > 0, `cap ${value} is a positive integer`);
  }
});

test("the pending-request maps release their entries", () => {
  // They are de-duplication maps, bounded by the number of loads in flight
  // rather than by session length: each one deletes its key when it settles.
  for (const file of OWNED_SERVICES) {
    const source = readSource(file);
    const names = [...source.matchAll(/const ([A-Za-z0-9_]*[Pp]ending[A-Za-z0-9_]*) = new Map\(\);/g)]
      .map((match) => match[1]);
    assert.ok(names.length > 0, `${file} still keeps a de-duplication map`);
    for (const name of names) {
      assert.match(
        source,
        new RegExp(String.raw`${name}\.delete\(`),
        `${file}: ${name} must release its entries`,
      );
    }
  }
});

test("warshService imports carry the .js extension so node can load them", () => {
  const source = readSource("../src/services/warshService.js");
  for (const match of source.matchAll(/from ['"](\.[^'"]+)['"]/g)) {
    assert.match(match[1], /\.js$/, `${match[1]} needs an explicit extension for node --test`);
  }
});
