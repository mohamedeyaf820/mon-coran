import assert from "node:assert/strict";
import test from "node:test";
import { alignSegmentsToText } from "../src/utils/tajwidAlignment.js";
import { normalizeTajwidAnnotation, parseTajweedAnnotation } from "../src/utils/tajwidAnnotation.js";

/* Quran.com annotates its Uthmani edition; the reader paints QPC. These are
   real pairs from api.quran.com (verse text fields of the same words). */

const rules = (segments) => segments.filter((segment) => segment.ruleId).map((segment) => [segment.text, segment.ruleId]);

function align(annotated, painted) {
  const result = alignSegmentsToText(parseTajweedAnnotation(annotated), painted);
  assert.ok(result, "word counts must match");
  assert.equal(result.segments.map((segment) => segment.text).join(""), painted, "painted text must never change");
  return result;
}

test("a sukun spelled U+0652 in one edition and U+06E1 in the other keeps its rule", () => {
  const { segments } = align("بِ<rule class=ham_wasl>ٱ</rule>لۡمَلَ", "بِٱلْمَلَ");
  assert.deepEqual(rules(segments), [["ٱ", "ham-wasl"]]);
});

test("tatweel plus dagger alef maps onto alif maqsura plus dagger alef", () => {
  const { segments } = align("إِلَ<rule class=madda_normal>ـٰ</rule>هَ", "إِلَٰهَ");
  assert.deepEqual(rules(segments), [["ٰ", "madd-normal"]]);
});

test("the rub-el-hizb sign is its own word in QPC and glued in Uthmani", () => {
  const { segments, failedWords } = align("۞<rule class=ghunnah>إِنَّ</rule>", "۞ إِنَّ");
  assert.equal(failedWords, 0);
  assert.deepEqual(rules(segments), [["إِنَّ", "ghunna"]]);
});

test("a different vowel is never aligned, the word stays plain and is reported", () => {
  const { segments, failedWords } = align("<rule class=ghunnah>نُ</rule>", "نَ");
  assert.equal(failedWords, 1);
  assert.deepEqual(rules(segments), []);
});

test("different letters are never aligned", () => {
  const { segments, failedWords } = align("<rule class=ghunnah>مَ</rule>", "نَ");
  assert.equal(failedWords, 1);
  assert.deepEqual(rules(segments), []);
});

test("another word count is refused outright", () => {
  assert.equal(alignSegmentsToText(parseTajweedAnnotation("<rule class=ghunnah>نَ</rule> مَ"), "نَ"), null);
});

test("normalizeTajwidAnnotation reports a mapped annotation", () => {
  const result = normalizeTajwidAnnotation("وَٱلْحَىُّ", "وَ<rule class=ham_wasl>ٱ</rule>لۡحَىُّ");
  assert.equal(result.status, "annotated");
  assert.equal(result.alignment, "mapped");
  assert.equal(result.diagnostic, null);
  assert.equal(result.segments.map((segment) => segment.text).join(""), "وَٱلْحَىُّ");
});
