import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getAyahTextForFont } from "../src/data/fonts.js";
import {
  hasCoherentWordData,
  isAyahMarkerToken,
  splitRecitableWords,
} from "../src/utils/wordCoherence.js";
import { comparableArabicText } from "../src/utils/quranUtils.js";

// Authentic capture of 15:7 from api.quran.com plus the DOM the app painted for
// it before the word-division repair. The word division is what the per-word
// recitation is indexed on, so a verse field that loses a boundary has to be
// caught rather than recited against a neighbouring word.
const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/word-coherence-15-7.json", import.meta.url), "utf8"),
);

// Mirrors quranComAPI.normalizeWord + AyahTextRenderer's clickableWords filter:
// the guard only ever sees this shape.
function toWordShape(word) {
  const [surah, ayah] = String(word.verse_key || "").split(":").map(Number);
  return {
    surah: Number(word.chapter_id || surah) || null,
    ayah: Number(word.verse_number || ayah) || null,
    position: Number(word.position) || null,
    text: word.text_uthmani || word.text_qpc_hafs || word.text_indopak || word.text,
    textUthmani: word.text_uthmani || "",
    textQpcHafs: word.text_qpc_hafs || "",
    textIndopak: word.text_indopak || "",
    charType: word.char_type_name || "word",
  };
}

const allWords = fixture.words.map(toWordShape);
const words = allWords.filter((word) => !word.charType || word.charType === "word");
const ayah = {
  text: fixture.verseText.text_uthmani,
  quranCom: {
    textUthmani: fixture.verseText.text_uthmani,
    textQpcHafs: fixture.verseText.text_qpc_hafs,
    textIndopak: fixture.verseText.text_indopak,
  },
  words: allWords,
};

const [SURAH, AYAH] = fixture.key.split(":").map(Number);
const recitable = (value) => splitRecitableWords(value).filter(Boolean);
const lettersOf = (value) => comparableArabicText(recitable(value).join(" ")).replace(/\s+/g, "");
const cp = (...points) => String.fromCodePoint(...points);

function coherent(text, fontId = "qpc-hafs", riwaya = "hafs", list = words) {
  return hasCoherentWordData(list, text, fontId, riwaya, SURAH, AYAH);
}

function withField(textQpcHafs) {
  return { ...ayah, quranCom: { ...ayah.quranCom, textQpcHafs } };
}

test("the captured field glues two words the list divides", () => {
  assert.equal(words.length, 8);
  assert.equal(allWords.length, 9, "the end marker entry is part of the API payload");
  assert.equal(allWords.at(-1).charType, "end");
  assert.equal(recitable(fixture.dom.text).length, words.length - 1);
  assert.equal(
    recitable(fixture.dom.text)[0],
    words[0].textQpcHafs + words[1].textQpcHafs,
    "the fixture no longer shows the lost separator it was captured for",
  );
});

test("a verse field that loses a word boundary is detected, not recited blind", () => {
  assert.equal(coherent(fixture.dom.text), false);
  assert.equal(coherent(fixture.verseText.text_qpc_hafs), false);
});

test("the painted Hafs text regains the authoritative word division", () => {
  for (const [fontId, field] of [
    ["qpc-hafs", "textQpcHafs"],
    ["amiri-quran", "textUthmani"],
    ["qpc-indopak", "textIndopak"],
  ]) {
    const painted = getAyahTextForFont(ayah, fontId, "hafs");
    assert.equal(
      recitable(painted).length,
      words.length,
      `${field} still paints ${fixture.key} as one fewer word`,
    );
    assert.equal(coherent(painted, fontId), true, `${field} stays incoherent after repair`);
  }
});

test("restoring the division changes segmentation only, never a letter", () => {
  const painted = getAyahTextForFont(ayah, "qpc-hafs", "hafs");
  assert.equal(
    lettersOf(painted),
    lettersOf(fixture.dom.text),
    "the repaired verse must carry the same Quran letters as the captured one",
  );
});

test("a real wording difference is left alone", () => {
  const painted = getAyahTextForFont(ayah, "qpc-hafs", "hafs");
  assert.equal(coherent(painted, "qpc-hafs", "hafs", words.slice(0, -1)), false);

  // Same token count, different letters: not a lost separator, so the field wins.
  const swapped = ayah.quranCom.textQpcHafs.replace(words[5].textQpcHafs, words[6].textQpcHafs);
  assert.notEqual(swapped, ayah.quranCom.textQpcHafs);
  const swappedPainted = getAyahTextForFont(withField(swapped), "qpc-hafs", "hafs");
  assert.equal(
    recitable(swappedPainted).filter((token) => token === words[6].textQpcHafs).length,
    2,
    "a letter difference must not be overwritten by the word list",
  );

  // A field that carries more tokens than the list is not missing a boundary.
  const longerField = `${ayah.quranCom.textQpcHafs} ${words[2].textQpcHafs}`;
  const longerPainted = getAyahTextForFont(withField(longerField), "qpc-hafs", "hafs");
  assert.equal(
    recitable(longerPainted)[0],
    words[0].textQpcHafs + words[1].textQpcHafs,
    "a field with more tokens than the list was not missing a separator and must survive",
  );
});

test("word data from another verse revokes per-word recitation", () => {
  const painted = getAyahTextForFont(ayah, "qpc-hafs", "hafs");
  assert.equal(
    coherent(painted, "qpc-hafs", "hafs", words.map((w) => ({ ...w, ayah: AYAH + 1 }))),
    false,
  );
  assert.equal(
    coherent(painted, "qpc-hafs", "hafs", words.map((w) => ({ ...w, surah: SURAH + 1 }))),
    false,
  );
});

test("an absent word array or empty text has nothing to align against", () => {
  const painted = getAyahTextForFont(ayah, "qpc-hafs", "hafs");
  assert.equal(coherent(painted, "qpc-hafs", "hafs", []), false);
  assert.equal(coherent("", "qpc-hafs", "hafs", words), false);
});

test("ayah-end markers are never recitable words", () => {
  const endMarker = fixture.words.at(-1).text_qpc_hafs;
  for (const token of [
    endMarker,
    cp(0x06dd) + endMarker,
    cp(0x06de) + endMarker,
    cp(0xfd3e) + endMarker + cp(0xfd3f),
  ]) {
    assert.equal(isAyahMarkerToken(token), true, `${JSON.stringify(token)} should be a marker`);
  }
  for (const word of words) {
    assert.equal(isAyahMarkerToken(word.textQpcHafs), false, "a Quran word must stay recitable");
  }
});
