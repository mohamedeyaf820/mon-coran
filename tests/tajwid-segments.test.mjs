import assert from "node:assert/strict";
import test from "node:test";

import {
  getRulesForRiwaya,
  stabilizeTajwidSegments,
} from "../src/data/tajwidRules.js";
import {
  getReadableWaqfGlyph,
  normalizeQuranGlyphText,
} from "../src/utils/quranUtils.js";

test("tajwid segments keep leading Arabic marks attached to their base glyph", () => {
  const segments = stabilizeTajwidSegments([
    { text: "\u0630", ruleId: null },
    { text: "\u064E\u0672", ruleId: "madd-normal" },
    { text: "\u0644\u0650\u0643\u064E", ruleId: null },
  ]);

  assert.deepEqual(segments, [
    { text: "\u0630\u064E\u0670\u0644\u0650\u0643\u064E", ruleId: null },
  ]);
  assert.equal(segments.map((segment) => segment.text).join("").includes("\u0672"), false);
});

test("tajwid segments retain the coloured base after moving a leading harakah", () => {
  const segments = stabilizeTajwidSegments([
    { text: "\u0645", ruleId: null },
    { text: "\u064E\u0627\u0653", ruleId: "madd-connected" },
  ]);

  assert.deepEqual(segments, [
    { text: "\u0645\u064E", ruleId: null },
    { text: "\u0627\u0653", ruleId: "madd-connected" },
  ]);
});

test("stand-in superscript alef is normalized without creating an isolated mark", () => {
  const segments = stabilizeTajwidSegments([
    { text: "\u0648", ruleId: null },
    { text: "\u0672", ruleId: "madd-normal" },
  ]);

  assert.deepEqual(segments, [
    { text: "\u0648\u0670", ruleId: null },
  ]);
});

test("QPC dotted-circle anchors never leak into the rendered Quran text", () => {
  const source = "\u0623\u064E\u0646\u064E\u0627\u25CC\u06E0 \u062E\u064E\u064A\u0652\u0631\u064C";

  assert.equal(
    normalizeQuranGlyphText(source),
    "\u0623\u064E\u0646\u064E\u0627\u06E0 \u062E\u064E\u064A\u0652\u0631\u064C",
  );

  const segments = stabilizeTajwidSegments([
    { text: "\u0623\u064E\u0646\u064E\u0627\u25CC", ruleId: "madd-normal" },
    { text: "\u06E0 \u062E\u064E\u064A\u0652\u0631\u064C", ruleId: null },
  ]);

  assert.equal(segments.map((segment) => segment.text).join(""), normalizeQuranGlyphText(source));
  assert.equal(segments.some((segment) => segment.text.includes("\u25CC")), false);
});

test("QPC filled fallback dots are normalized to the canonical Quranic sign", () => {
  const segments = stabilizeTajwidSegments([
    { text: "\u062A\u064E\u0623\u06E1\u0645\u064E\u06EC", ruleId: null },
    { text: "\u0646\u0651\u064E\u0627", ruleId: "ghunna" },
  ]);
  const rendered = segments.map((segment) => segment.text).join("");

  assert.equal(rendered.includes("\u06EC"), false);
  assert.equal(rendered.includes("\u06EB"), true);
});

test("Al-Mulk waqf marks cannot be isolated by a zero-width separator", () => {
  const source = "\u0639\u064E\u0645\u064E\u0644\u0627\u064B\u200C\u06DA \u0648\u064E\u0647\u064F\u0648\u064E";
  const normalized = normalizeQuranGlyphText(source);
  const segments = stabilizeTajwidSegments([
    { text: "\u0639\u064E\u0645\u064E\u0644\u0627\u064B\u200C", ruleId: null },
    { text: "\u06DA \u0648\u064E\u0647\u064F\u0648\u064E", ruleId: null },
  ]);
  const rendered = segments.map((segment) => segment.text).join("");

  assert.equal(normalized, "\u0639\u064E\u0645\u064E\u0644\u0627\u064B\u06DA \u0648\u064E\u0647\u064F\u0648\u064E");
  assert.equal(rendered.includes("\u200C\u06DA"), false);
  assert.equal(rendered.includes("\u06DA"), true);
});

test("interactive waqf signs use readable glyphs instead of dotted-circle combining marks", () => {
  assert.equal(getReadableWaqfGlyph("\u06D6"), "\u0635\u0644\u0649");
  assert.equal(getReadableWaqfGlyph("\u06DA"), "\u062C");
  assert.equal(getReadableWaqfGlyph("\u06DB"), "\u2234");
  assert.equal(getReadableWaqfGlyph("\u06DC"), "\u0633");
});

test("Hafs and Warsh use the shared Quran.com Tajweed color semantics", () => {
  const expected = {
    ghunna: "#26b55d",
    qalqala: "#00deff",
    "madd-normal": "#ffc1e0",
    "madd-separated": "#ff8e3b",
    "madd-connected": "#ff5e8e",
    madd: "#e30000",
    "lam-shamsiyya": "#999999",
    tafkhim: "#3c84d5",
  };

  for (const riwaya of ["hafs", "warsh"]) {
    const colors = Object.fromEntries(
      getRulesForRiwaya(riwaya).map(({ id, color }) => [id, color]),
    );

    for (const [ruleId, color] of Object.entries(expected)) {
      assert.equal(colors[ruleId], color, `${riwaya}:${ruleId}`);
    }
  }
});
