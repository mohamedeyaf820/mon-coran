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

test("interactive waqf signs preserve their canonical Quran code point on a safe anchor", () => {
  assert.equal(getReadableWaqfGlyph("\u06D6"), "\u00A0\u06D6");
  assert.equal(getReadableWaqfGlyph("\u06DA"), "\u00A0\u06DA");
  assert.equal(getReadableWaqfGlyph("\u06DB"), "\u00A0\u06DB");
  assert.equal(getReadableWaqfGlyph("\u06DC"), "\u00A0\u06DC");
});

test("Hafs and Warsh use the shared Quran.com Tajweed color semantics", () => {
  // The legend palette (cyan qalqala, royal blue tafkhim, light pink normal
  // madd, orange separated madd, magenta connected madd, red necessary madd,
  // green ghunna family, grey silent letters) is shared by both riwayas.
  const expected = {
    ghunna: "#27ae60",
    qalqala: "#00d2ff",
    "madd-normal": "#f48fb1",
    "madd-separated": "#ff9800",
    "madd-connected": "#e91e63",
    madd: "#e53935",
    "lam-shamsiyya": "#9e9e9e",
    tafkhim: "#2e86de",
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

test("stabilizeTajwidSegments reattaches base consonant when madd tag starts mid-word", () => {
  // Quran.com raw output for 67:10: "... مَا كُ<tajweed class=ghunnah>نّ</tajweed>َا ف<tajweed class=madda_obligatory>ِىٓ</tajweed> أَصْحَ..."
  const rawSegments = [
    { text: " مَا كُ", ruleId: null },
    { text: "نّ", ruleId: "ghunna" },
    { text: "َا ف", ruleId: null },
    { text: "ِىٓ", ruleId: "madd-connected" },
    { text: " أَصْحَ", ruleId: null },
  ];

  const stabilized = stabilizeTajwidSegments(rawSegments);

  // The base consonant 'فِ' must be unified with 'ىٓ' into a single 'فِىٓ' segment
  // so the OpenType compound ligature is never split or clipped by browser text shapers.
  const fiiSegment = stabilized.find((s) => s.text === "فِىٓ");
  assert.ok(fiiSegment, "Segment for 'فِىٓ' must exist intact");
  assert.equal(fiiSegment.ruleId, "madd-connected");

  // Reconstructed plain text must be 100% identical and continuous
  const fullText = stabilized.map((s) => s.text).join("");
  assert.equal(fullText, " مَا كُنَّا فِىٓ أَصْحَ");
});

test("stabilizeTajwidSegments handles isolated word-start 'ف' with madd", () => {
  const rawSegments = [
    { text: "ف", ruleId: null },
    { text: "ِىٓ", ruleId: "madd-separated" },
  ];

  const stabilized = stabilizeTajwidSegments(rawSegments);
  assert.deepEqual(stabilized, [
    { text: "فِىٓ", ruleId: "madd-separated" },
  ]);
});

test("stabilizeTajwidSegments preserves Lam-Alef in cross-word idgham without ghunnah (68:24)", () => {
  // Quran.com raw output for 68:24: "أ<tajweed class=idgham_wo_ghunnah>َن ل</tajweed>َّا يَ<tajweed class=qalaqah>دْ</tajweed>خُلَ..."
  const rawSegments = [
    { text: "أ", ruleId: null },
    { text: "َن ل", ruleId: "silent" },
    { text: "َّا يَ", ruleId: null },
    { text: "دْ", ruleId: "qalqala" },
    { text: "خُلَ", ruleId: null },
    { text: "نّ", ruleId: "ghunna" },
    { text: "َهَا", ruleId: null },
  ];

  const stabilized = stabilizeTajwidSegments(rawSegments);

  // Reconstructed plain text must be 100% identical and continuous
  const fullText = stabilized.map((s) => s.text).join("");
  assert.equal(fullText, "أَن لَّا يَدْخُلَنَّهَا");

  // In word 1 'أَن', the nun must be silent (grey)
  const noonSeg = stabilized.find((s) => s.text === "ن");
  assert.ok(noonSeg, "Nun segment in 'أَن' must exist");
  assert.equal(noonSeg.ruleId, "silent");

  // In word 2 'لَّا', the Lam-Alef must NOT be split or marked silent
  // It should be part of a normal (ruleId: null) segment containing 'لَّا'
  const laaSeg = stabilized.find((s) => s.text.includes("لَّا"));
  assert.ok(laaSeg, "Segment with 'لَّا' must exist intact");
  assert.equal(laaSeg.ruleId, null, "'لَّا' must be voiced (ruleId: null), never silent");
});


