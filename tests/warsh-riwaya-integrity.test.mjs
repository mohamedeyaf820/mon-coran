/**
 * Riwaya-integrity tests for the Warsh/Hafs joins, the Warsh audio playlists,
 * the pinned Warsh sources and the Quran.com end-of-ayah strip.
 *
 * These lock the rules documented in src/data/warshHafsNumbering.js:
 * 6214 Warsh ayahs vs 6236 Hafs ayahs, 50 surahs split differently, so nothing
 * keyed on Hafs numbers (audio, translation, tafsir, word-by-word) may be
 * joined on a raw Warsh numberInSurah.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";

import SURAHS from "../src/data/surahs.js";
import {
  WARSH_DATA_BASE_URL,
  WARSH_LEGACY_JSON_SHA256,
  WARSH_LEGACY_JSON_URL,
  getWarshPageStart,
  getSurahVerseCountByRiwaya,
  getWarshSurahAyahCount,
  hafsNumbersForAyah,
} from "../src/constants/warshSource.js";
import {
  buildAudioPlaylistForSurah,
  buildAudioPlaylistForSurahs,
  buildSurahAudioPlaylist,
  getHafsSurahGlobalStart,
  normalizeAyahsForAudioPlaylist,
} from "../src/utils/audioPlaylist.js";

const readSource = (relativePath) =>
  fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

// Extract one top-level function body from a source file. Guards against the
// empty-string case, which would otherwise make the assertions pass vacuously.
function sourceFunction(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `${signature} not found`);
  const end = source.indexOf("\n}\n", start);
  assert.ok(end > start, `end of ${signature} not found`);
  const body = source.slice(start, end + 3);
  assert.ok(body.length > signature.length + 10, `${signature} body extracted`);
  return body;
}

const ayahAt = (surah, numberInSurah) => ({ surah: { number: surah }, numberInSurah });

/* ── 1. Hafs enrichment joins through the numbering mapping ─────────────── */

test("Warsh ayahs next to a divergence point resolve to the Hafs verses they recite", () => {
  // Al-Fatiha: the basmala is ornamental in the Warsh mushaf, so Warsh 1 is
  // Hafs 2 (al-Hamdu), not the Hafs basmala.
  assert.deepEqual(hafsNumbersForAyah(ayahAt(1, 1), "warsh"), [2], "warsh 1:1");
  assert.deepEqual(hafsNumbersForAyah(ayahAt(1, 7), "warsh"), [7], "warsh 1:7");
  // Al-Baqara opens with a merge, then accumulates an offset of +1.
  assert.deepEqual(hafsNumbersForAyah(ayahAt(2, 1), "warsh"), [1, 2], "warsh 2:1 recites hafs 1+2");
  assert.deepEqual(hafsNumbersForAyah(ayahAt(2, 2), "warsh"), [3], "warsh 2:2 recites hafs 3");
  assert.deepEqual(hafsNumbersForAyah(ayahAt(2, 198), "warsh"), [199], "before the second merge");
  assert.deepEqual(hafsNumbersForAyah(ayahAt(2, 199), "warsh"), [200, 201], "warsh 2:199 merges");
  assert.deepEqual(hafsNumbersForAyah(ayahAt(2, 285), "warsh"), [286], "last warsh verse");
  // Ya-Sin and Ar-Rum: merge/split right at the opening verses.
  assert.deepEqual(hafsNumbersForAyah(ayahAt(36, 1), "warsh"), [1, 2], "warsh 36:1 recites hafs 1+2");
  assert.deepEqual(hafsNumbersForAyah(ayahAt(36, 2), "warsh"), [3], "warsh 36:2 recites hafs 3");
  assert.deepEqual(hafsNumbersForAyah(ayahAt(30, 1), "warsh"), [1, 2, 3], "warsh 30:1 merges three");
});

test("unplaceable Warsh verses resolve to null instead of a neighbouring verse", () => {
  // Past the surah's last Warsh ayah (Al-Baqara has 285, not 286).
  assert.equal(hafsNumbersForAyah(ayahAt(2, 286), "warsh"), null);
  // The ornamental basmala has no numbered Warsh counterpart.
  assert.equal(hafsNumbersForAyah(ayahAt(1, 0), "warsh"), null, "basmala row");
  assert.equal(hafsNumbersForAyah(ayahAt(0, 1), "warsh"), null, "unknown surah");
  assert.equal(hafsNumbersForAyah({ numberInSurah: 3 }, "warsh"), null, "no surah number");
});

test("the Hafs join keeps raw verse numbers untouched", () => {
  assert.deepEqual(hafsNumbersForAyah(ayahAt(2, 286), "hafs"), [286]);
  assert.deepEqual(hafsNumbersForAyah(ayahAt(2, 286)), [286], "defaults to hafs");
  // Every hafs verse resolves to itself, in both call styles used by the app.
  for (const surah of [1, 2, 30, 36, 114]) {
    for (let n = 1; n <= Number(SURAHS[surah - 1].ayahs); n += 1) {
      assert.deepEqual(hafsNumbersForAyah(ayahAt(surah, n), "hafs"), [n], `hafs ${surah}:${n}`);
    }
  }
});

test("mergeHafsSupport resolves its lookup key through the mapping", () => {
  const source = readSource("src/components/QuranDisplay/useQuranDisplayData.js");
  const body = sourceFunction(source, "function mergeHafsSupport(");

  assert.match(body, /hafsNumbersForAyah\(ayah, riwaya\)/, "join goes through the mapping");
  assert.ok(
    !body.includes("${ayah.surah?.number}:${ayah.numberInSurah}"),
    "Warsh verses must never be looked up by raw numberInSurah",
  );
  assert.match(body, /\bhafsNumbers\[0\]/, "the lookup key is the resolved hafs verse");
  assert.match(
    source,
    /mergeHafsSupport\(fetchedAyahs, hafsMap, riwaya\)/,
    "the caller passes the active riwaya",
  );

  // Behavioural mirror of the join: a reader showing Warsh 2:2 must receive the
  // enrichment of hafs 3, never the one of hafs 2.
  const hafsAyah = (surah, n, text) => ({ surah: { number: surah }, numberInSurah: n, text });
  const hafsMap = new Map(
    [hafsAyah(2, 2, "hafs-2"), hafsAyah(2, 3, "hafs-3"), hafsAyah(2, 286, "hafs-286")].map(
      (a) => [`${a.surah.number}:${a.numberInSurah}`, a],
    ),
  );
  const join = (ayah, riwaya) => {
    const numbers = hafsNumbersForAyah(ayah, riwaya);
    return numbers?.length ? hafsMap.get(`${ayah.surah.number}:${numbers[0]}`) : null;
  };
  assert.equal(join(ayahAt(2, 2), "warsh")?.text, "hafs-3", "warsh 2:2 enrichment");
  assert.equal(join(ayahAt(2, 285), "warsh")?.text, "hafs-286", "warsh 2:285 enrichment");
  assert.equal(join(ayahAt(2, 2), "hafs")?.text, "hafs-2", "hafs path unchanged");
});

/* ── 2. Warsh audio playlists follow Warsh totals and numbering ─────────── */

test("per-surah Warsh totals reconcile the 6214-ayah mushaf", () => {
  assert.equal(getWarshSurahAyahCount(2), 285, "Al-Baqara");
  assert.equal(getWarshSurahAyahCount(5), 122, "Al-Ma'ida counts more warsh ayahs");
  assert.equal(getWarshSurahAyahCount(36), 82, "Ya-Sin");
  assert.equal(getWarshSurahAyahCount(1), 7, "Al-Fatiha");
  assert.equal(getWarshSurahAyahCount(114), 6, "An-Nas");
  assert.equal(getWarshSurahAyahCount(0), 0, "invalid surah has no total");
  assert.equal(getWarshSurahAyahCount(115), 0, "beyond the mushaf");

  const warshTotals = Array.from({ length: 114 }, (_, i) => getWarshSurahAyahCount(i + 1));
  assert.equal(warshTotals.reduce((a, b) => a + b, 0), 6214, "whole Warsh mushaf");
  for (const [index, count] of warshTotals.entries()) {
    assert.ok(count > 0, `surah ${index + 1} derives a total`);
    const playlist = buildSurahAudioPlaylist(index + 1, "warsh");
    assert.equal(playlist.length, count, `surah ${index + 1} playlist length`);
    assert.ok(
      playlist.every((item) => Number.isInteger(item.numberInSurah) && item.numberInSurah <= count),
      `surah ${index + 1} stays inside its warsh total`,
    );
  }
});

test("the reading header quotes the verse total of the riwaya being read", () => {
  assert.equal(getSurahVerseCountByRiwaya(67, "hafs"), 30, "Al-Mulk in Hafs");
  assert.equal(getSurahVerseCountByRiwaya(67, "warsh"), 31, "Al-Mulk splits one verse");
  assert.equal(getSurahVerseCountByRiwaya(67), 30, "hafs is the default riwaya");
  assert.equal(getSurahVerseCountByRiwaya(1, "warsh"), 7, "Al-Fatiha counts alike");
  assert.equal(getSurahVerseCountByRiwaya(2, "warsh"), 285);
  assert.equal(getSurahVerseCountByRiwaya(2, "hafs"), 286);
  for (let surah = 1; surah <= 114; surah += 1) {
    assert.ok(getSurahVerseCountByRiwaya(surah, "warsh") > 0, `warsh total for ${surah}`);
    assert.ok(getSurahVerseCountByRiwaya(surah, "hafs") > 0, `hafs total for ${surah}`);
  }
});

test("home mushaf totals quote the active riwaya", async () => {
  const { getMushafAyahTotal } = await import(
    "../src/components/Home/homeConstants.js"
  );
  assert.equal(getMushafAyahTotal("hafs"), 6236, "Hafs counting");
  assert.equal(getMushafAyahTotal("warsh"), 6214, "Warsh Madinah counting");
  assert.equal(
    getMushafAyahTotal("warsh"),
    Array.from({ length: 114 }, (_, i) => getWarshSurahAyahCount(i + 1)).reduce((a, b) => a + b, 0),
    "the strip sums the same per-surah totals the reader uses",
  );
  for (const file of [
    "src/components/Home/HomePrimitives.jsx",
    "src/components/Home/StatsStrip.jsx",
    "src/components/recitation/SurahRecitationRow.jsx",
    "src/components/Sidebar.jsx",
  ]) {
    assert.match(
      readSource(file),
      /getSurahVerseCountByRiwaya|getMushafAyahTotal/,
      `${file} counts ayahs through the riwaya`,
    );
  }
});

test("buildSurahAudioPlaylist for Warsh Al-Baqara yields 285 verses, not 286", () => {
  const warsh = buildSurahAudioPlaylist(2, "warsh");
  assert.equal(warsh.length, 285);
  assert.deepEqual(warsh[0], {
    surah: 2,
    surahNumber: 2,
    ayah: 1,
    numberInSurah: 1,
    warshNumber: 1,
    hafsNumber: 1,
    hafsNumbers: [1, 2],
    riwaya: "warsh",
    number: getHafsSurahGlobalStart(2),
  });
  assert.equal(warsh[1].numberInSurah, 2, "warsh position");
  assert.equal(warsh[1].hafsNumber, 3, "hafs verse it recites");
  assert.equal(warsh[1].number, getHafsSurahGlobalStart(2) + 2, "hafs-keyed global number");
  assert.equal(warsh.at(-1).numberInSurah, 285);
  assert.equal(warsh.at(-1).hafsNumber, 286, "the closing verse is hafs 286");

  // Surahs where Warsh counts MORE ayahs than Hafs used to be truncated.
  assert.equal(buildSurahAudioPlaylist(5, "warsh").length, 122);
  assert.equal(buildSurahAudioPlaylist(5).length, 120);

  // Global numbers stay inside the hafs mushaf and never go backwards.
  const globals = buildSurahAudioPlaylist(36, "warsh").map((item) => item.number);
  assert.ok(globals.every((n) => Number.isInteger(n) && n > 0 && n <= 6236), "valid hafs globals");
  assert.deepEqual([...globals].sort((a, b) => a - b), globals, "ascending");
});

test("the Hafs playlist shape is unchanged", () => {
  const hafs = buildSurahAudioPlaylist(2);
  assert.equal(hafs.length, 286);
  assert.deepEqual(hafs[0], {
    surah: 2,
    surahNumber: 2,
    ayah: 1,
    numberInSurah: 1,
    number: 8,
  });
  assert.deepEqual(hafs.at(-1), {
    surah: 2,
    surahNumber: 2,
    ayah: 286,
    numberInSurah: 286,
    number: 293,
  });
  assert.deepEqual(buildSurahAudioPlaylist(2, "hafs"), hafs);
  assert.deepEqual(buildSurahAudioPlaylist(115), [], "unknown surah");
  assert.equal(
    Array.from({ length: 114 }, (_, i) => buildSurahAudioPlaylist(i + 1).length).reduce(
      (a, b) => a + b,
      0,
    ),
    6236,
    "hafs totals unchanged",
  );
});

test("the async playlist builders honour the riwaya without new I/O", async () => {
  assert.equal((await buildAudioPlaylistForSurah(2, "warsh")).length, 285);
  assert.equal((await buildAudioPlaylistForSurah(2, "hafs")).length, 286);
  assert.equal((await buildAudioPlaylistForSurah(2)).length, 286);
  assert.equal((await buildAudioPlaylistForSurahs([2, 5], "warsh")).length, 285 + 122);
  assert.deepEqual(await buildAudioPlaylistForSurah(999, "warsh"), [], "invalid surah");

  const source = readSource("src/utils/audioPlaylist.js");
  assert.ok(!source.includes("void riwaya"), "riwaya is no longer ignored");
  assert.ok(!/dbGet|indexedDB|await import/.test(source), "playlist building stays synchronous");
});

test("displayed Warsh ayahs normalize onto hafs-keyed global numbers", () => {
  const [warshItem] = normalizeAyahsForAudioPlaylist(
    [ayahAt(2, 2), { surah: { number: 2 }, numberInSurah: 285 }],
    2,
    "warsh",
  );
  assert.equal(warshItem.numberInSurah, 2, "keeps the warsh position");
  assert.equal(warshItem.warshNumber, 2);
  assert.equal(warshItem.hafsNumber, 3);
  assert.equal(warshItem.number, getHafsSurahGlobalStart(2) + 2, "hafs global");

  // The legacy Warsh source carries its own 1..6214 row id, which is not a
  // hafs global number, so it must not win for Warsh payloads.
  const [withRowId] = normalizeAyahsForAudioPlaylist(
    [{ surah: { number: 2 }, numberInSurah: 2, number: 9 }],
    2,
    "warsh",
  );
  assert.equal(withRowId.number, getHafsSurahGlobalStart(2) + 2);

  const [hafsItem] = normalizeAyahsForAudioPlaylist(
    [{ surah: { number: 2 }, numberInSurah: 2, number: 9 }],
    2,
  );
  assert.deepEqual(hafsItem, {
    surah: 2,
    surahNumber: 2,
    ayah: 2,
    numberInSurah: 2,
    number: 9,
    text: "",
  });
});

/* ── 3. Warsh source integrity gates ───────────────────────────────────── */

test("both Warsh text sources are pinned to immutable commits", () => {
  for (const url of [WARSH_DATA_BASE_URL, WARSH_LEGACY_JSON_URL]) {
    assert.match(url, /^https:\/\/raw\.githubusercontent\.com\//, "raw host");
    assert.ok(!/\/(main|master)\//.test(url), `${url} must not track a mutable branch`);
    assert.match(url, /\/[0-9a-f]{40}\//, "pinned to a full commit sha");
  }
  assert.match(WARSH_DATA_BASE_URL, /warsh_text\/$/, "per-surah directory base");
  assert.match(WARSH_LEGACY_JSON_SHA256, /^[0-9a-f]{64}$/, "sha-256 digest");
});

test("the local Warsh page source is exact and every ayah has one page", () => {
  const bytes = fs.readFileSync(new URL("../public/data/warsh-page-source.json", import.meta.url));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), WARSH_LEGACY_JSON_SHA256);
  const rows = JSON.parse(bytes.toString("utf8"));
  assert.equal(rows.length, 6214);
  const pageCounts = new Map();
  const rangeRows = [];
  for (const row of rows) {
    const page = getWarshPageStart(row.page);
    assert.ok(page >= 1 && page <= 604, `ayah ${row.id} has a printed page`);
    pageCounts.set(page, (pageCounts.get(page) || 0) + 1);
    if (String(row.page).includes("-")) rangeRows.push([row.id, page]);
  }
  assert.equal(pageCounts.size, 604);
  assert.equal([...pageCounts.values()].reduce((sum, count) => sum + count, 0), 6214);
  assert.deepEqual(rangeRows, [[536, 85], [2434, 317], [2824, 354], [2830, 355]]);
});

test("warshService requires the exact verse count and verifies the digest", () => {
  const source = readSource("src/services/warshService.js");
  const body = sourceFunction(source, "function validateWarshRows(");
  assert.match(body, /getWarshSurahAyahCount\(surahNumber\)/, "expects the warsh total");
  assert.match(body, /records\.length !== expected/, "requires the exact count");
  assert.ok(!body.includes("* 0.8"), "no more 80% tolerance for truncated surahs");
  assert.ok(!/getSurah\(surahNumber\)\?\.ayahs/.test(source), "never validated against hafs totals");

  const fetchBody = sourceFunction(source, "async function loadLegacyWarshData(");
  assert.match(fetchBody, /sha256Hex\(rawBytes\)/, "digests the fetched bytes");
  assert.match(fetchBody, /WARSH_LEGACY_JSON_SHA256/, "against the pinned digest");
  assert.ok(
    fetchBody.includes("digest !== WARSH_LEGACY_JSON_SHA256") && fetchBody.includes("dbSet("),
    "digest gate and cache write both present",
  );
  assert.ok(
    fetchBody.indexOf("digest !== WARSH_LEGACY_JSON_SHA256") < fetchBody.indexOf("dbSet("),
    "rejects before caching to IndexedDB",
  );
});

/* ── 4. End-of-ayah stripping must not eat Quran text ──────────────────── */

test("Quran.com stripping keeps presentation-form ligatures as content", async () => {
  const { fetchQuranComText } = await import("../src/services/quranComAPI.js");
  const originalFetch = globalThis.fetch;
  const allahLigature = "﷼"; // ARABIC LIGATURE ALLAH
  const salawatLigature = "﷽"; // ARABIC LIGATURE SALLALLAHOU ALAYHE WASALLAM
  const ayahEndMarker = "۝"; // END OF AYAH rosette
  const rubElHizbMarker = "۞"; // START OF RUB EL HIZB
  const uthmani = `قُلْ هُوَ ${allahLigature} ٱللَّهُ أَحَدٌ${salawatLigature} ${ayahEndMarker}١${rubElHizbMarker}`;

  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      verse: {
        id: 6236,
        chapter_id: 112,
        verse_key: "112:1",
        verse_number: 1,
        page_number: 604,
        juz_number: 30,
        text_uthmani: uthmani,
      },
    }),
  });

  try {
    const ayah = await fetchQuranComText("ayah/112:1");
    assert.equal(ayah.text.includes(allahLigature), true, "allah ligature survived the strip");
    assert.equal(ayah.text.includes(salawatLigature), true, "salawat ligature survived the strip");
    assert.equal(ayah.text.includes(ayahEndMarker), false, "end-of-ayah rosette stripped");
    assert.equal(ayah.text.includes(rubElHizbMarker), false, "rub-el-hizb marker stripped");
    assert.equal(ayah.quranCom.textUthmani.includes(allahLigature), true, "cached copy intact");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the Quran.com strip rule no longer covers presentation-form ranges", () => {
  const source = readSource("src/services/quranComAPI.js");
  const body = sourceFunction(source, "function stripVerseEndGlyphs(");
  assert.ok(
    !/\\uFC00|\\uFD00|\\uFDF0/.test(body),
    "presentation forms must not be stripped",
  );
  assert.match(body, /\[\\u06DD\\u06DE\]/, "only the proven marker bases are stripped");
});
