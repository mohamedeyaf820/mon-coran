/**
 * Locks the Hafs-coordinate contract for every Hafs-keyed consumer reached
 * from a verse's action surface (tafsir, bookmarks, notes, playlist, share
 * deep links).
 *
 * AyahActions treats its `ayah` prop as the Hafs storage coordinate
 * (AyahActionsModal passes `hafsNumber`). Warsh and Hafs diverge from
 * Al-Baqara 2 onward — Warsh 2:2 recites Hafs 3 — so any surface that hands
 * AyahActions the displayed Warsh number silently attaches the neighbouring
 * verse's tafsir and bookmarks. These tests pin the seams that must convert.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  getWarshHafsMapping,
  isWarshNumberedAyah,
} from "../src/components/QuranDisplay/displayHelpers.js";
import {
  getWarshSurahAyahCount,
  hafsNumbersForAyah,
} from "../src/constants/warshSource.js";

const readSource = (relativePath) =>
  fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

/* ── 1. The mapping helper itself ───────────────────────────────────────── */

test("warsh coordinates: Hafs ayahs map to themselves", () => {
  const ayah = { surah: { number: 2 }, numberInSurah: 255 };
  assert.deepEqual(getWarshHafsMapping(ayah, "hafs"), [255]);
  assert.equal(isWarshNumberedAyah(ayah), false);
});

test("warsh coordinates: a mapped Warsh ayah resolves through hafsNumbers", () => {
  const ayah = {
    surah: { number: 2 },
    numberInSurah: 2,
    requestedRiwaya: "warsh",
    hafsNumbers: [3],
  };
  assert.equal(isWarshNumberedAyah(ayah), true);
  assert.deepEqual(getWarshHafsMapping(ayah, "warsh"), [3]);
});

test("warsh coordinates: an unplaced Warsh ayah yields null, never a neighbour", () => {
  const ayah = { surah: { number: 2 }, numberInSurah: 2, requestedRiwaya: "warsh" };
  assert.equal(getWarshHafsMapping(ayah, "warsh"), null);
});

test("warsh coordinates: invalid or missing verse numbers yield null", () => {
  assert.equal(getWarshHafsMapping({}, "warsh"), null);
  assert.equal(getWarshHafsMapping({ numberInSurah: 0 }, "hafs"), null);
  assert.equal(getWarshHafsMapping({ numberInSurah: 1.5 }, "hafs"), null);
});

/* ── 2. The mapping data covers the whole Warsh mushaf ──────────────────── */

test("warsh coordinates: every numbered Warsh ayah resolves to Hafs numbers", () => {
  let total = 0;
  for (let surah = 1; surah <= 114; surah += 1) {
    const count = getWarshSurahAyahCount(surah);
    assert.ok(Number.isInteger(count) && count > 0, `surah ${surah} has no Warsh count`);
    for (let ayah = 1; ayah <= count; ayah += 1) {
      const hafs = hafsNumbersForAyah({ surah: { number: surah }, numberInSurah: ayah }, "warsh");
      assert.ok(Array.isArray(hafs) && hafs.length > 0, `warsh ${surah}:${ayah} unresolved`);
      assert.ok(
        hafs.every((n) => Number.isInteger(n) && n >= 1 && n <= ayah * 2 + 2),
        `warsh ${surah}:${ayah} maps outside its neighbourhood: ${hafs}`,
      );
      total += 1;
    }
  }
  assert.equal(total, 6214, "the Madinah Warsh mushaf carries 6214 numbered ayahs");
});

test("warsh coordinates: the documented divergence anchor stays exact", () => {
  // Before the first split the numbers are identical; from Warsh 2:2 the
  // recitation runs ahead of Hafs numbering.
  assert.deepEqual(hafsNumbersForAyah({ surah: { number: 2 }, numberInSurah: 1 }, "warsh"), [1, 2]);
  assert.deepEqual(hafsNumbersForAyah({ surah: { number: 2 }, numberInSurah: 2 }, "warsh"), [3]);
  // and it converges back: both Warsh recitations of Ayat al-Kursi are Hafs 255.
  assert.deepEqual(hafsNumbersForAyah({ surah: { number: 2 }, numberInSurah: 253 }, "warsh"), [255]);
  assert.deepEqual(hafsNumbersForAyah({ surah: { number: 2 }, numberInSurah: 254 }, "warsh"), [255]);
});

/* ── 3. Call-site wiring: every AyahActions seam passes the Hafs coordinate */

test("warsh coordinates: all action surfaces hand AyahActions the mapped number", () => {
  const modal = readSource("src/components/QuranDisplay/AyahActionsModal.jsx");
  const qcWrapper = readSource("src/components/QuranDisplay/QCVerseActions.jsx");
  const footer = readSource("src/components/Quran/AyahBlockFooter.jsx");
  assert.match(modal, /const storageVerseNumber = ayahData\?\.hafsNumber \?\? verseNumber;/);
  assert.match(qcWrapper, /ayah=\{ayahData\?\.hafsNumber \?\? ayah\}/);
  assert.match(footer, /ayah=\{ayah\.hafsNumber \?\? ayah\.numberInSurah\}/);
});

/* ── 4. The data layer always attaches the mapping for Warsh ────────────── */

test("warsh coordinates: useQuranDisplayData attaches the mapping on every path", () => {
  const source = readSource("src/components/QuranDisplay/useQuranDisplayData.js");
  assert.match(source, /function attachWarshHafsMapping\(ayahs, riwaya\) \{/);
  const calls = source.match(/attachWarshHafsMapping\(/g) || [];
  assert.ok(calls.length >= 3, "definition + fetchData + preloadQuranDisplayData");
  assert.match(
    source,
    /const fetchedAyahs = attachWarshHafsMapping\(\s*cachedData\?\.ayahs \|\| ensureRequestedRiwaya/,
  );
  assert.match(
    source,
    /const fetchedAyahs = attachWarshHafsMapping\(\s*ensureRequestedRiwaya\(arabicData\.ayahs \|\| \[\], riwaya\),\s*riwaya,\s*\);/,
    "the prefetch path feeding the fullscreen page cache must map too",
  );
});
