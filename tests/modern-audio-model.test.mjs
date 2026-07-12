import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAudioQueueState,
  formatAudioTime,
  normalizeAudioResume,
} from "../src/modern/audio/audioModel.js";

test("formats audio time safely", () => {
  assert.equal(formatAudioTime(0), "0:00");
  assert.equal(formatAudioTime(65.9), "1:05");
  assert.equal(formatAudioTime(Number.NaN), "0:00");
});

test("builds a bounded serializable queue state", () => {
  const queue = buildAudioQueueState([
    { surah: 2, ayah: 1, number: 8, text: "a" },
    { surahNumber: 2, numberInSurah: 2, number: 9, text: "b" },
  ], 9);

  assert.equal(queue.index, 1);
  assert.deepEqual(queue.items.map((item) => [item.surah, item.ayah]), [[2, 1], [2, 2]]);
});

test("rejects stale or invalid resume positions", () => {
  const now = 1_000_000;
  assert.equal(normalizeAudioResume({ surah: 0 }, now), null);
  assert.equal(normalizeAudioResume({ surah: 1, ayah: 1, reciter: "r", timestamp: now - 8 * 86400000 }, now), null);
  assert.deepEqual(
    normalizeAudioResume({ surah: 1, ayah: 2, reciter: "r", currentTime: 12, duration: 20, timestamp: now }, now),
    { surah: 1, ayah: 2, reciter: "r", currentTime: 12, duration: 20, timestamp: now },
  );
});
