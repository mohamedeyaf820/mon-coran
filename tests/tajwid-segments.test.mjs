import assert from "node:assert/strict";
import test from "node:test";

import { stabilizeTajwidSegments } from "../src/data/tajwidRules.js";

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
