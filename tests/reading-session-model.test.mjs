import test from "node:test";
import assert from "node:assert/strict";
import { buildReadingInterval, countIntervalAyahs } from "../src/modern/reader/readingSessionModel.js";

test("builds an ordered same-surah reading interval", () => {
  assert.deepEqual(buildReadingInterval({ surah: 2, ayah: 12 }, { surah: 2, ayah: 18 }), { surah: 2, fromAyah: 12, toAyah: 18, ayahsRead: 7 });
});

test("uses the selected verse as a one-ayah interval without a start marker", () => {
  assert.deepEqual(buildReadingInterval(null, { surah: 1, ayah: 4 }), { surah: 1, fromAyah: 4, toAyah: 4, ayahsRead: 1 });
});

test("rejects reversed and cross-surah intervals", () => {
  assert.equal(buildReadingInterval({ surah: 2, ayah: 20 }, { surah: 2, ayah: 10 }), null);
  assert.equal(buildReadingInterval({ surah: 1, ayah: 2 }, { surah: 2, ayah: 2 }), null);
  assert.equal(countIntervalAyahs(8, 10), 3);
});
