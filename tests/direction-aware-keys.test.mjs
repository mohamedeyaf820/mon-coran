import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  computeDirectionTarget,
  getDirectionIntent,
} from "../src/hooks/useDirectionAwareKeys.js";

const source = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("direction intents: LTR arrow mapping", () => {
  assert.equal(getDirectionIntent("ArrowLeft", "fr"), "decrease");
  assert.equal(getDirectionIntent("ArrowRight", "fr"), "increase");
  assert.equal(getDirectionIntent("ArrowUp", "fr"), "increase");
  assert.equal(getDirectionIntent("ArrowDown", "fr"), "decrease");
  assert.equal(getDirectionIntent("ArrowLeft", "en"), "decrease");
  assert.equal(getDirectionIntent("ArrowRight", "en"), "increase");
});

test("direction intents: Arabic swaps horizontal arrows only", () => {
  assert.equal(getDirectionIntent("ArrowRight", "ar"), "decrease");
  assert.equal(getDirectionIntent("ArrowLeft", "ar"), "increase");
  assert.equal(getDirectionIntent("ArrowUp", "ar"), "increase");
  assert.equal(getDirectionIntent("ArrowDown", "ar"), "decrease");
});

test("direction intents: Home/End recognized, other keys ignored", () => {
  for (const lang of ["fr", "en", "ar"]) {
    assert.equal(getDirectionIntent("Home", lang), "start");
    assert.equal(getDirectionIntent("End", lang), "end");
    assert.equal(getDirectionIntent("a", lang), null);
    assert.equal(getDirectionIntent("Enter", lang), null);
    assert.equal(getDirectionIntent(" ", lang), null);
  }
});

test("direction targets: step and clamp match the original slider math", () => {
  assert.equal(computeDirectionTarget("decrease", 0.5), 0.45);
  assert.equal(computeDirectionTarget("increase", 0.5), 0.55);
  assert.equal(computeDirectionTarget("decrease", 0.02), 0);
  assert.equal(computeDirectionTarget("increase", 0.98), 1);
  assert.equal(computeDirectionTarget("start", 0.7), 0);
  assert.equal(computeDirectionTarget("end", 0.7), 1);
  assert.equal(computeDirectionTarget("decrease", 0.5, 0.2), 0.3);
});

test("AudioPlayer consumes the hook instead of inlining the RTL swap", () => {
  const audioPlayer = source("src/components/AudioPlayer.jsx");
  assert.match(audioPlayer, /useDirectionAwareKeys/);
  assert.doesNotMatch(audioPlayer, /rtl\s?\?\s?"ArrowRight"/);
});
