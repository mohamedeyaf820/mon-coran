import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeTajwidAnnotation, withTajwidPresentationSuffix, assertTajwidIntegrity, parseTajweedAnnotation, stripTajweedMarkup, getWholeWordTajwidRule } from "../src/utils/tajwidAnnotation.js";
import { getHafsTajwidSource } from "../src/utils/hafsTajwidSource.js";
import { splitTajwidIntoWords } from "../src/utils/tajwidWords.js";
const fixture = JSON.parse(readFileSync(new URL("./fixtures/tajwid-official-verses.json", import.meta.url), "utf8"));

test("official verses cover long, short and dense passages without changing the authoritative source", () => {
  assert.ok(fixture.verses.some(verse => verse.key === "2:282"));
  assert.ok(fixture.verses.some(verse => verse.key.startsWith("112:")));
  for (const verse of fixture.verses) {
    const parsed = parseTajweedAnnotation(verse.annotation);
    assert.equal(parsed.map(segment => segment.text).join(""), stripTajweedMarkup(verse.annotation), `QURAN_TEXT_INTEGRITY_FAILURE:${verse.key}`);
    const result = normalizeTajwidAnnotation(verse.original, verse.annotation);
    assert.equal(result.segments.map(segment => segment.text).join(""), verse.original, `QURAN_TEXT_INTEGRITY_FAILURE:${verse.key}`);
    if (result.diagnostic) {
      assert.throws(() => assertTajwidIntegrity(result), /QURAN_TEXT_INTEGRITY_FAILURE/);
      // An unalignable word stays plain; the verse's other words may keep their colours.
      if (result.diagnostic.reason !== "word-not-alignable") assert.ok(result.segments.every(segment => segment.ruleId === null));
    } else assertTajwidIntegrity(result);
  }
});

test("nested tags, entities and non-BMP characters preserve exact text", () => {
  const original = "نَ\u200cۚ  مَ\u0672\u{1F4D6}&";
  const annotation = '<tajweed class="ghunnah">نَ\u200cۚ</tajweed>  <span class="madda_normal">مَ\u0672\u{1F4D6}</span>&amp;';
  const result = assertTajwidIntegrity(normalizeTajwidAnnotation(original, annotation));
  assert.equal(result.segments.map(segment => segment.text).join(""), original);
  assert.ok(result.segments.some(segment => segment.ruleId));
});

test("malformed or mismatched annotations fail the strict audit and retain plain text at runtime", () => {
  for (const annotation of ['<tajweed class=ghunnah>نَ', '<rule class=ghunnah>مَ</rule>', '<script>نَ</script>']) {
    const result = normalizeTajwidAnnotation("نَ", annotation);
    assert.equal(result.text, "نَ");
    assert.throws(() => assertTajwidIntegrity(result), /QURAN_TEXT_INTEGRITY_FAILURE/);
  }
});

test("Warsh original text wins over every Hafs annotation even with equal lengths", () => {
  const result = normalizeTajwidAnnotation("نَ", '<rule class=ghunnah>نَ</rule>', { riwaya: "warsh" });
  assert.equal(result.status, "unavailable");
  assert.deepEqual(result.segments, [{ text: "نَ", ruleId: null }]);
});

test("whole-word ink requires one rule covering every source character", () => {
  const text = "نَّمَا";
  assert.equal(getWholeWordTajwidRule(text, [{ start: 0, end: 2, ruleId: "ghunna" }]), null);
  assert.equal(getWholeWordTajwidRule(text, [{ start: 0, end: text.length, ruleId: "ghunna" }]), "ghunna");
  assert.equal(getWholeWordTajwidRule(text, [{ start: 0, end: 2, ruleId: "ghunna" }, { start: 2, end: text.length, ruleId: "madd-normal" }]), null);
});

test("word rendering preserves separators and one complete Unicode shaping run", () => {
  const original = "  نَّ\u0672\u{1F4D6}\tمَ\u200cۚ  ";
  const segments = [{ text: "  ن", ruleId: null }, { text: original.slice(3), ruleId: "ghunna" }];
  const { words } = splitTajwidIntoWords(segments);
  assert.equal(words.map(word => (word.prefix || "") + word.text + (word.separator || "")).join(""), original, "QURAN_TEXT_INTEGRITY_FAILURE");
  assert.equal(words.length, 2);
  assert.equal(words[0].text, "نَّ\u0672\u{1F4D6}");
  assert.equal(splitTajwidIntoWords([{ text: " \t  " }]).whitespaceOnly, " \t  ");
});


test("all Hafs surfaces consume the same canonical verse and reject incompatible word annotations together", () => {
  const ayah = { numberInSurah: 7, surah: { number: 15 }, text: "نَ  مَ", quranCom: { textUthmani: "نَ  مَ", textTajweed: '<tajweed class=ghunnah>نَ</tajweed>  مَ' }, words: [{ textUthmani: "نَ", textTajweed: '<tajweed class=qalaqah>نَ</tajweed>' }, { textUthmani: "مَ" }] };
  const source = getHafsTajwidSource(ayah, "uthmani");
  assert.equal(source.words.map(word => (word.prefix || "") + word.text + (word.separator || "")).join(""), source.original);
  assert.equal(source.words[0].ranges[0].ruleId, "ghunna");
  const rejected = getHafsTajwidSource({ ...ayah, quranCom: { ...ayah.quranCom, textTajweed: '<tajweed class=ghunnah>نُ</tajweed>  مَ' } }, "uthmani");
  assert.equal(rejected.diagnostic.code, "QURAN_TEXT_INTEGRITY_FAILURE");
  assert.ok(rejected.words.every(word => !word.ranges.length));
  assert.equal(rejected.original, source.original);
});

test("the malformed official 32:3 annotation is rejected rather than repaired", () => {
  const verse = fixture.verses.find(verse => verse.key === "32:3");
  assert.ok(verse);
  const result = normalizeTajwidAnnotation(verse.original, verse.annotation);
  assert.equal(result.diagnostic.reason, "malformed-annotation");
  assert.throws(() => assertTajwidIntegrity(result), /QURAN_TEXT_INTEGRITY_FAILURE/);
});


test("QPC verse furniture never becomes a second mushaf word or annotation offset", () => {
  const ayah = { numberInSurah: 6, surah: { number: 2 }, text: "إِنَّ", quranCom: { textQpcHafs: "إِنَّ ٦", textTajweed: '<tajweed class=ghunnah>إِنَّ</tajweed>' }, words: [{ textUthmani: "إِنَّ", textQpcHafs: "إِنَّ", charType: "word" }, { textQpcHafs: "٦", charType: "end" }] };
  const source = getHafsTajwidSource(ayah, "qpc-hafs");
  assert.equal(source.original, "إِنَّ");
  assert.deepEqual(source.words.map(word => word.text), ["إِنَّ"]);
  assert.equal(source.status, "annotated");
});


test("presentation markers preserve the shared verdict instead of healing rejected source text", () => {
  const source = normalizeTajwidAnnotation("نَ", '<tajweed class=ghunnah>نَ</tajweed> ١');
  const displayed = withTajwidPresentationSuffix(source, "نَ\u202f١");
  assert.equal(displayed.diagnostic.code, "QURAN_TEXT_INTEGRITY_FAILURE");
  assert.equal(displayed.segments.map(segment => segment.text).join(""), "نَ\u202f١");
  assert.ok(displayed.segments.every(segment => !segment.ruleId));
  const valid = withTajwidPresentationSuffix(normalizeTajwidAnnotation("نَ", '<tajweed class=ghunnah>نَ</tajweed>'), "نَ\u202f١");
  assertTajwidIntegrity(valid);
  assert.equal(valid.segments[0].ruleId, "ghunna");
  assert.equal(valid.segments.at(-1).ruleId, null);
});
