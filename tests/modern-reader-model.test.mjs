import test from "node:test";
import assert from "node:assert/strict";

import { buildReaderVerses, parseTajweedSegments } from "../src/modern/reader/readerModel.js";

test("joins translations to verses by surah and ayah", () => {
  const verses = buildReaderVerses({
    arabic: { ayahs: [
      { text: "A", numberInSurah: 1, surah: { number: 1 }, page: 1, juz: 1 },
      { text: "B", numberInSurah: 2, surah: { number: 1 }, page: 1, juz: 1 },
    ] },
    translations: [{ ayahs: [
      { text: "Ouverture", numberInSurah: 1, surah: { number: 1 } },
    ] }],
  });

  assert.equal(verses[0].translation, "Ouverture");
  assert.equal(verses[1].translation, "");
  assert.equal(verses[0].key, "1:1");
});

test("extracts safe tajweed segments without preserving markup", () => {
  assert.deepEqual(
    parseTajweedSegments('<tajweed class="ghunnah">abc</tajweed> def'),
    [{ text: "abc", rule: "ghunnah" }, { text: " def", rule: null }],
  );
  assert.deepEqual(parseTajweedSegments("plain"), [{ text: "plain", rule: null }]);
});
