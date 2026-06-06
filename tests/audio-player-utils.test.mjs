import test from "node:test";
import assert from "node:assert/strict";

import { getAudioPlayerLabels } from "../src/components/audioPlayer/audioPlayerLabels.js";
import {
  formatAudioTime,
  getReciterCooldownMs,
} from "../src/components/audioPlayer/audioPlayerUtils.js";

test("audio utils: formats playback time safely", () => {
  assert.equal(formatAudioTime(undefined), "0:00");
  assert.equal(formatAudioTime(NaN), "0:00");
  assert.equal(formatAudioTime(-4), "0:00");
  assert.equal(formatAudioTime(0), "0:00");
  assert.equal(formatAudioTime(5.9), "0:05");
  assert.equal(formatAudioTime(65), "1:05");
  assert.equal(formatAudioTime(3605), "60:05");
});

test("audio utils: reciter cooldown grows within defined bounds", () => {
  assert.equal(getReciterCooldownMs(0), 30_000);
  assert.equal(getReciterCooldownMs(1), 30_000);
  assert.equal(getReciterCooldownMs(2), 8 * 60 * 1000);
  assert.equal(getReciterCooldownMs(99), 4 * 60 * 60 * 1000);
});

test("audio labels: core controls are available in every UI language", () => {
  for (const lang of ["fr", "en", "ar"]) {
    const labels = getAudioPlayerLabels(lang);
    for (const key of [
      "region",
      "search",
      "close",
      "play",
      "pause",
      "next",
      "previous",
      "modalTitle",
      "modalSubtitle",
    ]) {
      assert.equal(typeof labels[key], "string");
      assert.ok(labels[key].length > 0, `${lang}.${key} should not be empty`);
    }
  }
});
