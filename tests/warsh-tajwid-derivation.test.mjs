/**
 * The Warsh derivation is only as trustworthy as its measurements, so they are
 * part of the build: the rule totals it produces on the pinned corpus, and the
 * inventory of the signs it refuses to paint, are asserted here. A corpus
 * refresh that moves a sign fails this test instead of silently repainting
 * Quran text.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  WARSH_PAINTED_RULES,
  WARSH_SIGN,
  WARSH_TAJWID_RULE_IDS,
  WARSH_TAJWID_SOURCE,
  WARSH_TANWIN_SIGNS,
  WARSH_UNPAINTED_SIGNS,
} from "../src/data/warshTajwidSigns.js";
import { getWarshPerWordTajweedRanges, readWarshClusters } from "../src/utils/warshTajwidRanges.js";
import { getWarshTajwidAnnotatedSource } from "../src/services/warshTajweedService.js";
import { warshDisplayWords } from "../src/services/warshTajweedService.js";

const rows = JSON.parse(readFileSync(new URL("../public/data/warsh-page-source.json", import.meta.url), "utf8"));
// The measurement runs on exactly the words a page prints: the reader's own
// canonicalisation (U+06EC -> U+06EB, marker tokens removed) is part of the
// contract, so the counts below describe the shipped path.
const printedWords = (ayahText, ayahNumber) => warshDisplayWords({ numberInSurah: ayahNumber, text: ayahText });

const RANGES_OVER_THE_CORPUS = rows.map((row) => ({
  key: `${row.sura_no}:${row.aya_no}`,
  words: printedWords(row.aya_text, row.aya_no),
  ranges: getWarshPerWordTajweedRanges(printedWords(row.aya_text, row.aya_no)),
}));

function measuredRuleTotals() {

  const totals = {};
  for (const ayah of RANGES_OVER_THE_CORPUS) {
    for (const wordRanges of ayah.ranges) {
      for (const range of wordRanges) totals[range.ruleId] = (totals[range.ruleId] || 0) + 1;
    }
  }
  return totals;
}

function measuredSignCount(codePoint) {
  let count = 0;
  for (const ayah of RANGES_OVER_THE_CORPUS) {
    for (const word of ayah.words) {
      for (const character of word) if (character.codePointAt(0) === codePoint) count += 1;
    }
  }
  return count;
}

test("the pinned Warsh corpus is the adopted source, with its digest on record", () => {
  assert.equal(rows.length, 6214);
  assert.equal(WARSH_TAJWID_SOURCE.ayahCount, 6214);
  assert.match(WARSH_TAJWID_SOURCE.sha256, /^[0-9a-f]{64}$/u);
  assert.equal(WARSH_TAJWID_SOURCE.commit.length, 40);
});

test("every rule painted on the corpus is the count the catalogue records", () => {
  const totals = measuredRuleTotals();
  for (const entry of WARSH_PAINTED_RULES) {
    assert.equal(totals[entry.ruleId], entry.painted, `${entry.ruleId} moved`);
  }
  assert.deepEqual(Object.keys(totals).sort(), [...WARSH_TAJWID_RULE_IDS].sort());
});

test("no painted range ever leaves the word it belongs to", () => {
  for (const ayah of RANGES_OVER_THE_CORPUS) {
    ayah.ranges.forEach((wordRanges, index) => {
      const word = ayah.words[index];
      if (!word) return;
      for (const range of wordRanges) {
        assert.ok(range.start >= 0, `${ayah.key} start`);
        assert.ok(range.end <= word.length, `${ayah.key} end`);
        assert.ok(range.end > range.start, `${ayah.key} empty range`);
        assert.ok(WARSH_TAJWID_RULE_IDS.includes(range.ruleId), `${ayah.key} unknown rule`);
      }
    });
  }
});

test("the derivation reads the printed text and returns the same characters", () => {
  const words = ["اِ۬لْحَمْدُ", "لِلّٰهِ", "رَبِّ"];
  const before = structuredClone(words);
  const ranges = getWarshPerWordTajweedRanges(words);
  assert.deepEqual(words, before);
  assert.equal(ranges.length, words.length);
  assert.ok(ranges[0].some((range) => range.ruleId === "ham-wasl"));
});

test("the article is painted as ham-wasl and its lam as lam-shamsiyya", () => {
  // اِ۬لرَّحْمَٰنِ: the alef carries the Wasl dabt, the lam is followed by a
  // doubled r — the two ranges the official Hafs annotation also paints.
  const [article] = getWarshPerWordTajweedRanges(["اِ۬لرَّحْمَٰنِ"]);
  assert.deepEqual(article.map((range) => range.ruleId), ["ham-wasl", "lam-shamsiyya"]);
});

test("a Hamzat qat' opening the same dabt is never painted as ham-wasl", () => {
  // U+06EC also carries اَ۬وْ and اَ۬ن, whose hamza is always pronounced, and
  // the hamza of ؤ / ئ. None of them may take the Wasl rule.
  assert.deepEqual(getWarshPerWordTajweedRanges(["اَ۬وْ"]), [[]]);
  assert.deepEqual(getWarshPerWordTajweedRanges(["اَ۬ن"]), [[]]);
  assert.deepEqual(getWarshPerWordTajweedRanges(["اَ۬لَّا"]), [[]]);
  assert.deepEqual(getWarshPerWordTajweedRanges(["يُوَ۬اخِذُكُمُ"]), [[]]);
});
test("Iqlab colours the marked letter and the ba that follows it", () => {
  // The edition prints the mim over the tanwin and writes the ba as the next
  // word, exactly as the official Hafs annotation does.
  const ranges = getWarshPerWordTajweedRanges(["أَلِيمٌۢ", "بِمَا"]);
  assert.deepEqual(ranges.map((list) => list.map((range) => range.ruleId)), [["iqlab"], ["iqlab"]]);
  assert.deepEqual(getWarshPerWordTajweedRanges(["مِنۢ", "بَيْت"])[0][0].ruleId, "iqlab");
});

test("the printed Sila letter is coloured, and its lengthened form is not", () => {
  // عَلَيْهِمُۥ is Sila ṣughrā; the maddah the edition prints on عَلَيْهِمُۥٓ is how
  // it writes the longer Sila kubrā, which gets no colour from this source.
  assert.deepEqual(getWarshPerWordTajweedRanges(["لَهُمُۥ"])[0].map((range) => range.ruleId), ["madd-normal"]);
  assert.deepEqual(getWarshPerWordTajweedRanges(["لَهُمُۥٓ"]), [[]]);
});

test("sukun and shadda reach the rules the Hafs annotation gives them", () => {
  assert.deepEqual(getWarshPerWordTajweedRanges(["كَفَرُواْ"])[0][0].ruleId, "silent");
  assert.deepEqual(getWarshPerWordTajweedRanges(["مِاْئَةَ"])[0][0].ruleId, "silent");
  assert.deepEqual(getWarshPerWordTajweedRanges(["رَزَقْنَٰ"])[0][0].ruleId, "qalqala");
  assert.deepEqual(getWarshPerWordTajweedRanges(["إِنَّ"])[0][0].ruleId, "ghunna");
});

test("a sign the source refuses to name never triggers a rule of its own", () => {
  // The edition prints a sign of its own on the alef it reads with imala or
  // taqlil (U+06EA, 2569 occurrences). It may ride along on a cluster that
  // another printed sign already claims — ٱللَّنَّارِ carries it beside the
  // shadda that gives its nun ghunna — but it never justifies a colour by
  // itself, and the dagger alef (10033) is never painted at all.
  const DECLARED_TRIGGERS = new Set([0x06ec, 0x06e2, 0x06e5, 0x06e6, 0x0651, 0x0652]);
  let imalaMarks = 0;
  let daggerMarks = 0;
  let daggerPainted = 0;
  const imalaOnlyPaint = [];
  for (const ayah of RANGES_OVER_THE_CORPUS) {
    ayah.ranges.forEach((wordRanges, index) => {
      const word = ayah.words[index] || "";
      for (const character of word) {
        const codePoint = character.codePointAt(0);
        if (codePoint === WARSH_SIGN.EMPTY_CENTRE_LOW_STOP) imalaMarks += 1;
        if (codePoint === WARSH_SIGN.DAGGER_ALEF) daggerMarks += 1;
      }
      for (const range of wordRanges) {
        const codes = [...word.slice(range.start, range.end)].map((character) => character.codePointAt(0));
        if (codes.includes(WARSH_SIGN.DAGGER_ALEF) && codes.length === 1) daggerPainted += 1;
        if (codes.includes(WARSH_SIGN.EMPTY_CENTRE_LOW_STOP)
          && !codes.some((codePoint) => DECLARED_TRIGGERS.has(codePoint))) {
          imalaOnlyPaint.push(`${ayah.key} ${range.ruleId}`);
        }
      }
    });
  }
  assert.equal(imalaMarks, 2569);
  assert.equal(daggerMarks, 10033);
  assert.equal(daggerPainted, 0);
  assert.deepEqual(imalaOnlyPaint, []);
});

test("both tanwin notations in the corpus are recognised as the same sign", () => {
  // Maghribi U+0656 / U+0657 / U+065E and Mashriqi U+064B/C/D: orthography,
  // so none of them carries a colour of its own.
  for (const codePoint of WARSH_TANWIN_SIGNS) {
    assert.equal(measuredSignCount(codePoint) > 0, true, `U+${codePoint.toString(16)} missing`);
  }
  assert.deepEqual(getWarshPerWordTajweedRanges(["رَيْبِۖ"]), [[]]);
  assert.deepEqual(getWarshPerWordTajweedRanges(["عَظِيمٌۖ"]), [[]]);
});

test("the signs the source refuses are still the ones the edition prints", () => {
  for (const entry of WARSH_UNPAINTED_SIGNS) {
    assert.equal(measuredSignCount(entry.sign), entry.occurrences, `U+${entry.sign.toString(16)} moved`);
  }
  assert.equal(measuredSignCount(WARSH_SIGN.SMALL_HIGH_NOON), 2);
});

test("an Iqlab mark is always followed by the ba it turns into", () => {
  let marks = 0;
  let atVerseEnd = 0;
  for (const ayah of RANGES_OVER_THE_CORPUS) {
    const clustersPerWord = ayah.words.map(readWarshClusters);
    clustersPerWord.forEach((clusters, wordIndex) => {
      clusters.forEach((cluster, index) => {
        if (!cluster.signs.includes(WARSH_SIGN.SMALL_HIGH_MEEM)) return;
        marks += 1;
        // The same walk the derivation does: the next printed letter, looking
        // past the sign-only tokens that carry no letter.
        let next = clusters[index + 1] || null;
        for (let word = wordIndex + 1; !next && word < clustersPerWord.length; word += 1) {
          next = clustersPerWord[word][0] || null;
        }
        if (!next) atVerseEnd += 1;
        else assert.equal(next.letter, 0x0628, `${ayah.key}: Iqlab mark not followed by ba`);
      });
    });
  }
  assert.equal(marks, 575);
  assert.equal(atVerseEnd, 13);
});


test("the verse-by-verse source paints the printed verse without altering it", () => {
  // 2:2 as the Warsh face draws it: the canonical wasl dabt of the article
  // arrives as U+06DF after the font boundary, and the verse keeps its words,
  // its spaces and its letters exactly.
  const printed = "الٓمٓ ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَۛ فِيهِ هُدًى لِّلْمُتَّقِينَ".replace(/ٱ/u, "ا\u06df");
  const source = getWarshTajwidAnnotatedSource(printed);

  // Fail-closed contract: the segments still spell the printed verse,
  // character for character, which is what TajweedText re-checks before
  // painting anything.
  assert.equal(
    source.segments.map((segment) => segment.text).join(""),
    printed,
    "the segments must reproduce the printed verse exactly",
  );
  assert.equal(source.status, "annotated");

  // The article is painted through the sign the Warsh face actually draws.
  const painted = source.segments.filter((segment) => segment.ruleId);
  assert.ok(painted.length > 0, "the verse carries painted spans");
  assert.ok(
    painted.some((segment) => segment.ruleId === "ham-wasl" && segment.text.includes("\u06df")),
    "the article is painted through the sign the Warsh face draws",
  );
  // And the shape guard still holds downstream of the font boundary: the same
  // code point opening a wasl verb is never the article.
  assert.equal(
    getWarshPerWordTajweedRanges(["ا\u06dfعْبُدُواْ"])[0].some((range) => range.ruleId === "ham-wasl"),
    false,
    "a wasl verb stays plain even though it carries the same code point",
  );
});

test("a verse with no readable sign stays plain instead of being repainted", () => {
  // Unvocalised letters carry none of the seven signs, so the derivation has
  // nothing to read and must leave the verse uncoloured rather than guess.
  const bare = "م ح";
  const plain = getWarshTajwidAnnotatedSource(bare);
  assert.equal(plain.status, "plain");
  assert.equal(plain.segments.map((segment) => segment.text).join(""), bare);
  assert.equal(getWarshTajwidAnnotatedSource("   "), null);
});
