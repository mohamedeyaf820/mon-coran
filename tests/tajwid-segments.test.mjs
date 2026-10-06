import assert from "node:assert/strict";
import test from "node:test";

import {
  getRulesForRiwaya,
  getPerWordTajweedRanges,
  stabilizeTajwidSegments,
} from "../src/data/tajwidRules.js";
import {
  getReadableWaqfGlyph,
} from "../src/utils/quranUtils.js";
import { WARSH_ARCHIVE_RULE_IDS } from "../src/data/warshArchiveManifest.js";
import { WARSH_TAJWID_RULE_IDS } from "../src/data/warshTajwidSigns.js";

test("tajwid segment boundaries preserve every letter and combining mark", () => {
  const input = [
    { text: "ذ", ruleId: null },
    { text: "َ\u0672", ruleId: "madd-normal" },
    { text: "لِكَ", ruleId: null },
  ];
  assert.deepEqual(stabilizeTajwidSegments(input), input);
});

test("only an annotated source produces Tajweed ranges", () => {
  // Plain text carries no verified rule, so nothing is painted. The letter
  // patterns that used to fill this test were an unsourced guess, and the
  // absence of a range is the honest answer for a word we cannot annotate.
  const plain = "\u0627\u0650\u0646\u0651\u064e\u0647\u064f";
  assert.deepEqual(getPerWordTajweedRanges([plain], "hafs")[0], []);

  // Warsh has no annotated source at all (WARSH_TAJWID_SOURCE_REQUIRED):
  // showing an invented rule there would be worse than showing none.
  assert.deepEqual(getPerWordTajweedRanges([plain], "warsh")[0], []);

  // An annotated word does yield ranges, and they stay inside the word:
  // a rule covering the whole word is not a rule range.
  const annotated = "\u0627\u0650<rule class=ikhafa>\u0646</rule>\u0651\u064e\u0647\u064f";
  const ranges = getPerWordTajweedRanges([annotated], "hafs")[0];
  assert.ok(ranges.length > 0, "the annotation must produce a range");
  for (const { start, end } of ranges) {
    assert.ok(start >= 0 && end <= annotated.length, "a range must stay in the word");
  }
  assert.equal(
    ranges.some(({ start, end }) => start === 0 && end === annotated.length),
    false,
    "a whole-word range is not a rule range",
  );
});


test("annotation stabilization never performs font or sign normalization", () => {
  const sources = ["و\u0672", "أَنَا\u25CC\u06E0", "تَأ\u06E1مَ\u06ECنَّا", "عَمَلاً\u200C\u06DA وَهُوَ", "مَآ"];
  for (const original of sources) {
    for (let boundary = 1; boundary < original.length; boundary++) {
      const segments = stabilizeTajwidSegments([
        { text: original.slice(0, boundary), ruleId: null },
        { text: original.slice(boundary), ruleId: "madd-normal" },
      ]);
      assert.equal(segments.map(segment => segment.text).join(""), original, "QURAN_TEXT_INTEGRITY_FAILURE");
    }
  }
});

test("interactive waqf signs preserve their canonical Quran code point on a safe anchor", () => {
  assert.equal(getReadableWaqfGlyph("\u06D6"), "\u00A0\u06D6");
  assert.equal(getReadableWaqfGlyph("\u06DA"), "\u00A0\u06DA");
  assert.equal(getReadableWaqfGlyph("\u06DB"), "\u00A0\u06DB");
  assert.equal(getReadableWaqfGlyph("\u06DC"), "\u00A0\u06DC");
});

test("source rule IDs use semantic CSS tokens; Warsh only publishes the rules its own edition prints", () => {
  assert.deepEqual(
    getRulesForRiwaya("warsh").map((rule) => rule.id).sort(),
    [...new Set([...WARSH_TAJWID_RULE_IDS, ...WARSH_ARCHIVE_RULE_IDS])].sort(),
  );
  for (const rule of [...getRulesForRiwaya("hafs"), ...getRulesForRiwaya("warsh")]) {
    assert.equal(rule.color, `var(--tajwid-${rule.id})`);
    assert.equal(rule.patterns.length, 0);
    assert.ok(rule.nameFr && rule.nameEn && rule.nameAr);
  }
});
