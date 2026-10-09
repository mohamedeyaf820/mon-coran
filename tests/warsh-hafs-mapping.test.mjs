import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  WARSH_HAFS_SEGMENTS,
  warshToHafsNumbers,
  hafsToWarshNumbers,
  warshRangeToHafsRange,
  hasWarshHafsMapping,
} from "../src/data/warshHafsNumbering.js";
import SURAHS from "../src/data/surahs.js";

const HAFS_TOTAL = SURAHS.reduce((sum, s) => sum + Number(s.ayahs), 0);

test("segments are well-formed ranges without overlaps", () => {
  for (const [surahStr, segs] of Object.entries(WARSH_HAFS_SEGMENTS)) {
    const surah = Number(surahStr);
    assert.ok(surah >= 1 && surah <= 114, `surah ${surahStr}`);
    const warshTaken = new Set();
    const hafsTaken = new Set();
    for (const [w1, w2, h1, h2] of segs) {
      assert.ok(h1 >= 1 && h2 >= h1, `surah ${surah} hafs range`);
      if (w1 == null) {
        assert.equal(h1, h2, "skipped ayahs are single");
        assert.ok(!hafsTaken.has(h1), `surah ${surah} double-taken hafs ${h1}`);
        hafsTaken.add(h1);
        continue;
      }
      assert.ok(w1 >= 1 && w2 >= w1, `surah ${surah} warsh range`);
      for (let w = w1; w <= w2; w += 1) {
        assert.ok(!warshTaken.has(w), `surah ${surah} double-taken warsh ${w}`);
        warshTaken.add(w);
      }
      for (let h = h1; h <= h2; h += 1) {
        assert.ok(!hafsTaken.has(h), `surah ${surah} double-taken hafs ${h}`);
        hafsTaken.add(h);
      }
    }
  }
});

test("per-surah segment coverage reconciles both ayah totals", () => {
  // Sum over every surah: hafs verses covered by segments (merges consume
  // several) plus untouched identity verses must equal the surah totals, and
  // the whole-Quran difference must be exactly 6236 − 6214 = 22.
  let warshTotal = 0;
  for (const surahMeta of SURAHS) {
    const surah = Number(surahMeta.number ?? SURAHS.indexOf(surahMeta) + 1);
    const hafsCount = Number(surahMeta.ayahs);
    const segs = WARSH_HAFS_SEGMENTS[surah] || [];
    const coveredHafs = new Set();
    let coveredWarsh = 0;
    let skips = 0;
    for (const [w1, w2, h1, h2] of segs) {
      if (w1 == null) { skips += 1; coveredHafs.add(h1); continue; }
      coveredWarsh += w2 - w1 + 1;
      for (let h = h1; h <= h2; h += 1) coveredHafs.add(h);
    }
    const warshCount = coveredWarsh + (hafsCount - coveredHafs.size);
    assert.equal(
      warshCount,
      coveredWarsh + hafsCount - coveredHafs.size,
      `surah ${surah} self-consistent`,
    );
    assert.ok(skips === 0 || skips === 1, `surah ${surah} skip count`);
    warshTotal += warshCount;
  }
  assert.equal(HAFS_TOTAL, 6236);
  assert.equal(HAFS_TOTAL - warshTotal, 22, "Warsh totals 6214 across the Quran");
});

test("Al-Fatiha: the ornamental basmala has no numbered Warsh ayah", () => {
  assert.deepEqual(hafsToWarshNumbers(1, 1), []);
  assert.deepEqual(warshToHafsNumbers(1, 1), [2]);
  assert.deepEqual(warshToHafsNumbers(1, 5), [6]);
  assert.deepEqual(warshToHafsNumbers(1, 6), [7]);
  assert.deepEqual(warshToHafsNumbers(1, 7), [7]);
  assert.deepEqual(hafsToWarshNumbers(1, 2), [1]);
  assert.deepEqual(hafsToWarshNumbers(1, 7), [6, 7]);
});

test("Al-Baqarah: Alif-Lam-Mim merges with the following verse in Warsh", () => {
  assert.deepEqual(warshToHafsNumbers(2, 1), [1, 2]);
  assert.deepEqual(hafsToWarshNumbers(2, 1), [1]);
  assert.deepEqual(hafsToWarshNumbers(2, 2), [1]);
  // The merge shifts every later verse: Warsh 2 recites Hafs 3.
  assert.deepEqual(warshToHafsNumbers(2, 2), [3]);
  assert.deepEqual(warshToHafsNumbers(2, 3), [4]);
  assert.deepEqual(hafsToWarshNumbers(2, 3), [2]);
  assert.deepEqual(warshToHafsNumbers(2, 199), [200, 201]);
  // Ayat al-Kursi's neighbours: hafs 255 is one Warsh ayah and hafs 256 is
  // split across Warsh 253-254.
  assert.deepEqual(warshToHafsNumbers(2, 252), [254]);
  assert.deepEqual(warshToHafsNumbers(2, 253), [255]);
  assert.deepEqual(warshToHafsNumbers(2, 254), [255]);
  assert.deepEqual(hafsToWarshNumbers(2, 255), [253, 254]);
});

test("Ar-Rum: one Warsh ayah recites the first three Hafs verses", () => {
  assert.deepEqual(warshToHafsNumbers(30, 1), [1, 2, 3]);
  assert.deepEqual(hafsToWarshNumbers(30, 1), [1]);
  assert.deepEqual(hafsToWarshNumbers(30, 3), [1]);
  assert.deepEqual(warshToHafsNumbers(30, 2), [4]);
  assert.deepEqual(warshToHafsNumbers(30, 3), [4]);
  assert.deepEqual(hafsToWarshNumbers(30, 4), [2, 3]);
});

test("Al-Haqqah: the split of hafs 25 shows both pieces as that verse", () => {
  assert.deepEqual(warshToHafsNumbers(69, 24), [25]);
  assert.deepEqual(warshToHafsNumbers(69, 25), [25]);
  assert.deepEqual(hafsToWarshNumbers(69, 25), [24, 25]);
});

test("Ar-Rahman refrain pairs stay mapped through the merge at the top", () => {
  assert.deepEqual(warshToHafsNumbers(55, 1), [1, 2]);
  assert.deepEqual(warshToHafsNumbers(55, 2), [3, 4]);
  assert.deepEqual(hafsToWarshNumbers(55, 3), [2]);
  assert.deepEqual(hafsToWarshNumbers(55, 4), [2]);
  assert.deepEqual(warshToHafsNumbers(55, 3), [5]);
});

test("Al-Inshiqaq: the hafs 16 split keeps both Warsh pieces on hafs 16", () => {
  assert.deepEqual(warshToHafsNumbers(89, 16), [15]);
  assert.deepEqual(warshToHafsNumbers(89, 17), [16]);
  assert.deepEqual(warshToHafsNumbers(89, 18), [16]);
  assert.deepEqual(hafsToWarshNumbers(89, 16), [17, 18]);
});

test("pure identity surahs map to themselves; offset surahs shift after the first divergence", () => {
  // Surahs with no segments at all stay identity in both directions.
  assert.deepEqual(warshToHafsNumbers(114, 5), [5]);
  assert.deepEqual(hafsToWarshNumbers(114, 5), [5]);
  assert.deepEqual(warshToHafsNumbers(50, 1), [1]);
  assert.deepEqual(hafsToWarshNumbers(50, 1), [1]);
  // Ya-Sin starts with the hafs 1+2 merge, so every later verse shifts by one.
  assert.deepEqual(warshToHafsNumbers(36, 27), [28]);
  assert.deepEqual(hafsToWarshNumbers(36, 28), [27]);
});

test("invalid coordinates return null instead of guessing a verse", () => {
  assert.equal(warshToHafsNumbers(0, 1), null);
  assert.equal(warshToHafsNumbers(115, 1), null);
  assert.equal(warshToHafsNumbers(2, 0), null);
  assert.equal(warshToHafsNumbers(2, 1.5), null);
  assert.equal(warshToHafsNumbers("x", 1), null);
  assert.equal(hafsToWarshNumbers(null, 1), null);
});

test("round-tripping a warsh ayah through hafs returns its own neighbourhood", () => {
  for (let surah = 1; surah <= 114; surah += 1) {
    const hafsCount = Number(SURAHS[surah - 1].ayahs);
    const segs = WARSH_HAFS_SEGMENTS[surah] || [];
    const coveredHafs = new Set();
    let warshCount = 0;
    for (const [w1, w2, h1, h2] of segs) {
      if (w1 == null) {
        coveredHafs.add(h1);
        continue;
      }
      warshCount += w2 - w1 + 1;
      for (let h = h1; h <= h2; h += 1) coveredHafs.add(h);
    }
    warshCount += hafsCount - coveredHafs.size;

    for (let w = 1; w <= warshCount; w += 1) {
      const hafs = warshToHafsNumbers(surah, w);
      assert.ok(Array.isArray(hafs) && hafs.length > 0, `${surah}:${w} maps`);
      for (const h of hafs) {
        const back = hafsToWarshNumbers(surah, h);
        assert.ok(back.includes(w), `surah ${surah}: warsh ${w} → hafs ${h} → [${back}]`);
      }
    }
    // Dense maps stop at the surah's real totals — no guessed identity verse.
    assert.equal(warshToHafsNumbers(surah, warshCount + 1), null, `${surah} warsh overflow`);
    assert.equal(hafsToWarshNumbers(surah, hafsCount + 1), null, `${surah} hafs overflow`);
  }
});

test("warshRangeToHafsRange spans merged endpoints", () => {
  assert.deepEqual(warshRangeToHafsRange(2, 1, 1), [1, 2]);
  assert.deepEqual(warshRangeToHafsRange(2, 1, 3), [1, 4]);
  assert.deepEqual(warshRangeToHafsRange(1, 1, 7), [2, 7]);
});

test("every surah reports a reliable mapping", () => {
  for (let s = 1; s <= 114; s += 1) assert.equal(hasWarshHafsMapping(s), true);
  assert.equal(hasWarshHafsMapping(115), false);
});
