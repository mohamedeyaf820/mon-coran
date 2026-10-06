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

test("the wavy-hamza alef Quran.com uses for the dagger alef carries its rule onto the dagger alef", () => {
  // 2:2 verse-level annotation: dhalika, madd normal on fatha + U+0672.
  const { segments, failedWords } = align("ذ<tajweed class=madda_normal>\u064E\u0672</tajweed>لِكَ", "ذَٰلِكَ");
  assert.equal(failedWords, 0);
  // The span covered the fatha and the wavy-hamza alef: both painted signs take the rule.
  assert.deepEqual(rules(segments), [["\u064E\u0670", "madd-normal"]]);
});

test("a free-standing pause sign is not a word of its own", () => {
  const { segments, failedWords } = align("رَيْ<rule class=ghunnah>بَ</rule>ۛ فِيهِ", "رَيْبَ ۛ فِيهِ");
  assert.equal(failedWords, 0);
  assert.deepEqual(rules(segments), [["بَ", "ghunna"]]);
});

test("the silent-alef sign written as a rounded zero maps to the annotation's sukun", () => {
  const { segments, failedWords } = align("قَالُو<rule class=slnt>ا</rule>\u0652", "قَالُوا\u06DF");
  assert.equal(failedWords, 0);
  assert.deepEqual(rules(segments), [["ا", "silent"]]);
});

test("before an iqlab meem, dammatan and damma are one sound", () => {
  const { failedWords } = align("عَلِيمُ<rule class=iqlab>\u06E2</rule>", "عَلِيمٌ\u06E2");
  assert.equal(failedWords, 0);
});

test("a different vowel before a plain letter is still never aligned", () => {
  const { failedWords } = align("<rule class=ghunnah>نُ</rule>", "نَ");
  assert.equal(failedWords, 1);
});

test("IndoPak: lenient mode matches by letters and keeps a letter rule on its letter", () => {
  const annotated = parseTajweedAnnotation("مِ<rule class=ikhafa>ن</rule>");
  // IndoPak always writes the sukun the Uthmani edition omits.
  const result = alignSegmentsToText(annotated, "مِنۡ", undefined, { lenient: true });
  assert.equal(result.failedWords, 0);
  assert.deepEqual(rules(result.segments), [["ن", "ikhfa"]]);
  // Strict mode refuses the same pair.
  assert.equal(alignSegmentsToText(annotated, "مِنۡ").failedWords, 1);
});

test("IndoPak: a one-letter prefix printed as its own word is folded into the next word", () => {
  const annotated = parseTajweedAnnotation("وَ<rule class=ikhafa>يُ</rule>قِيمُونَ");
  const result = alignSegmentsToText(annotated, "وَ يُقِيۡمُوۡنَ", undefined, { lenient: true });
  assert.ok(result);
  assert.equal(result.failedWords, 0);
});
