/**
 * Warsh ↔ Hafs ayah-numbering mapping.
 *
 * The two riwayat number the Qur'an differently (6214 Warsh ayahs vs 6236
 * Hafs ayahs; 50 surahs carry different splits/merges). Audio, translation,
 * tafsir and memorization feeds are all keyed on the Hafs (quran.com)
 * numbering, so Warsh verses must never be aligned by raw numberInSurah.
 *
 * Provenance: derived offline (scratch/generate-warsh-hafs-mapping.cjs,
 * 2026-09-19) by aligning the legacy Warsh Madinah dataset
 * (warshData_v2-1.json, 6214 rows) against Quran.com `text_uthmani_simple`
 * (6236 verses) on diacritic-stripped, rasm-normalized consonantal
 * skeletons. All 114 surahs aligned with zero coverage gaps: per surah,
 * segment-covered verses plus identity verses account exactly for both
 * totals. The segments below mark every point where the two countings
 * diverge or where a cumulative offset is in effect.
 *
 * Segment format: [warshStart, warshEnd, hafsStart, hafsEnd] (inclusive).
 *  - [w, w, h1, h2]  one Warsh ayah recites hafs h1..h2 as a single ayah.
 *  - [w1, w2, h, h]  one hafs ayah is counted as several Warsh ayahs.
 *  - [null, null, h, h]  a hafs ayah that has no counterpart as a numbered
 *    Warsh ayah (Al-Fatiha 1:1 — the basmala is ornamental in the Warsh
 *    Madinah mushaf).
 *  - [w, w, h, h] with w !== h  a 1:1 pair recorded so the cumulative offset
 *    introduced by an earlier merge/split stays explicit.
 *
 * Every lookup below runs against dense per-surah maps derived from these
 * segments. A sparse "numbers outside segments are identity" shortcut is
 * wrong as soon as one merge or split happened earlier in the surah: the
 * offset accumulates (Warsh 2:2 recites Hafs 3; Warsh 36:27 recites
 * Hafs 28).
 *
 * Status: mapping derived and structurally validated. Cross-checked against
 * classical Warsh verse-count tables by a qualified reader before shipping
 * audio/translation enrichment to end users: NEEDS_QURANIC_VALIDATION.
 */

import SURAHS from "./surahs.js";

export const WARSH_HAFS_SEGMENTS = Object.freeze({
  1: [[null, null, 1, 1], [1, 1, 2, 2], [2, 2, 3, 3], [3, 3, 4, 4], [4, 4, 5, 5], [5, 5, 6, 6], [6, 7, 7, 7]],
  2: [[1, 1, 1, 2], [199, 199, 200, 201], [253, 254, 255, 255]],
  3: [[1, 1, 1, 2], [3, 4, 4, 4], [48, 48, 48, 49], [91, 92, 92, 92]],
  4: [[44, 44, 44, 45]],
  5: [[1, 2, 1, 1], [16, 17, 15, 15]],
  6: [[1, 2, 1, 1], [67, 67, 66, 67], [73, 74, 73, 73], [162, 163, 161, 161]],
  7: [[1, 1, 1, 2], [28, 28, 29, 30], [36, 37, 38, 38], [136, 137, 137, 137]],
  8: [[42, 43, 42, 42]],
  9: [[70, 71, 70, 70]],
  11: [[54, 54, 54, 55], [85, 86, 86, 86], [118, 118, 118, 119], [120, 120, 121, 122]],
  13: [[5, 6, 5, 5], [17, 18, 16, 16], [25, 25, 23, 24]],
  14: [[1, 2, 1, 1], [6, 7, 5, 5], [11, 12, 9, 9], [22, 22, 19, 20]],
  17: [[107, 107, 107, 108]],
  18: [[22, 23, 22, 22], [24, 24, 23, 24], [35, 35, 35, 36], [84, 84, 85, 86], [87, 87, 89, 90], [89, 89, 92, 93], [99, 99, 103, 104]],
  19: [[1, 1, 1, 2], [40, 41, 41, 41], [75, 76, 75, 75]],
  20: [[1, 1, 1, 2], [38, 39, 39, 39], [41, 41, 41, 42], [77, 77, 78, 79], [84, 85, 86, 86], [86, 86, 87, 88], [87, 88, 89, 89], [91, 91, 92, 93], [104, 104, 106, 107], [120, 121, 123, 123], [129, 130, 131, 131]],
  21: [[66, 66, 66, 67]],
  22: [[19, 19, 19, 21]],
  23: [[45, 46, 45, 45]],
  24: [[36, 36, 36, 37], [42, 42, 43, 44]],
  26: [[1, 1, 1, 2], [48, 49, 49, 49], [210, 210, 210, 211]],
  27: [[33, 34, 33, 33], [45, 46, 44, 44]],
  28: [[1, 1, 1, 2], [22, 23, 23, 23]],
  29: [[1, 1, 1, 2], [28, 29, 29, 29]],
  30: [[1, 1, 1, 3], [2, 3, 4, 4]],
  31: [[1, 1, 1, 2]],
  32: [[1, 1, 1, 2], [9, 10, 10, 10]],
  35: [[43, 44, 43, 43]],
  36: [[1, 1, 1, 2]],
  38: [[1, 1, 1, 2], [83, 83, 84, 85]],
  39: [[3, 4, 3, 3], [12, 12, 11, 12], [14, 14, 14, 15], [35, 35, 36, 37], [37, 37, 39, 40]],
  40: [[1, 1, 1, 2], [17, 18, 18, 18], [53, 53, 53, 54], [57, 58, 58, 58], [73, 73, 73, 74]],
  41: [[1, 1, 1, 2]],
  42: [[1, 1, 1, 3], [30, 30, 32, 33]],
  43: [[1, 1, 1, 2], [51, 52, 52, 52]],
  44: [[1, 1, 1, 2], [33, 33, 34, 35], [41, 41, 43, 44]],
  45: [[1, 1, 1, 2]],
  46: [[1, 1, 1, 2]],
  47: [[4, 5, 4, 4]],
  52: [[1, 1, 1, 2], [12, 12, 13, 14]],
  53: [[28, 28, 28, 29]],
  55: [[1, 1, 1, 2], [2, 2, 3, 4], [33, 34, 35, 35]],
  56: [[8, 9, 8, 8], [10, 11, 9, 9], [20, 21, 18, 18], [25, 25, 22, 23], [43, 44, 41, 41]],
  57: [[13, 13, 13, 14]],
  58: [[20, 20, 20, 21]],
  67: [[9, 10, 9, 9]],
  69: [[1, 1, 1, 2], [24, 25, 25, 25]],
  71: [[23, 24, 23, 23], [26, 27, 25, 25]],
  73: [[1, 1, 1, 2], [16, 16, 17, 18]],
  74: [[40, 40, 40, 41]],
  75: [[16, 16, 16, 17]],
  79: [[37, 37, 37, 38]],
  89: [[15, 16, 15, 15], [17, 18, 16, 16], [25, 26, 23, 23], [32, 32, 29, 30]],
  96: [[15, 16, 15, 15]],
  99: [[6, 7, 6, 6]],
  101: [[1, 1, 1, 2]],
  103: [[1, 1, 1, 2], [2, 3, 3, 3]],
  106: [[4, 5, 4, 4]],
  107: [[6, 6, 6, 7]],
});

function range(from, to) {
  const out = [];
  for (let n = from; n <= to; n += 1) out.push(n);
  return out;
}

/**
 * Derive the dense warsh→hafs and hafs→warsh tables for one surah by
 * walking its segments with both cursors and filling identity runs between
 * them. The identity runs advance with the accumulated offset, which is
 * exactly what a sparse lookup would get wrong. Returns null when the
 * segments do not tile contiguously against the surah's Hafs total, so the
 * surah can degrade gracefully instead of returning a wrong verse.
 */
function buildSurahMaps(surah) {
  const hafsTotal = Number(SURAHS[surah - 1]?.ayahs);
  if (!Number.isInteger(hafsTotal) || hafsTotal < 1) return null;

  const segs = [...(WARSH_HAFS_SEGMENTS[surah] ?? [])].sort((a, b) => a[2] - b[2]);
  const warshToHafs = new Map();
  const hafsToWarsh = new Map();
  let nextW = 1;
  let nextH = 1;

  const put = (map, key, value) => {
    if (map.has(key)) return false;
    map.set(key, Object.freeze(value));
    return true;
  };

  const fillIdentity = (count) => {
    for (let k = 0; k < count; k += 1) {
      if (!put(warshToHafs, nextW + k, [nextH + k])) return false;
      if (!put(hafsToWarsh, nextH + k, [nextW + k])) return false;
    }
    nextW += count;
    nextH += count;
    return true;
  };

  for (const [w1, w2, h1, h2] of segs) {
    if (w1 == null) {
      // Hafs ayah with no numbered Warsh counterpart (ornamental basmala).
      if (h1 !== nextH || h2 !== h1) return null;
      if (!put(hafsToWarsh, h1, [])) return null;
      nextH += 1;
      continue;
    }
    const gapW = w1 - nextW;
    if (gapW < 0 || h1 !== nextH + gapW) return null;
    if (!fillIdentity(gapW)) return null;

    if (w1 === w2 && h1 === h2) {
      if (!put(warshToHafs, w1, [h1]) || !put(hafsToWarsh, h1, [w1])) return null;
      nextW += 1;
      nextH += 1;
    } else if (w1 === w2) {
      // Hafs merge: one Warsh ayah recites hafs h1..h2.
      if (!put(warshToHafs, w1, range(h1, h2))) return null;
      for (const h of range(h1, h2)) {
        if (!put(hafsToWarsh, h, [w1])) return null;
      }
      nextW += 1;
      nextH += h2 - h1 + 1;
    } else if (h1 === h2) {
      // Warsh split: one hafs ayah is counted as warsh w1..w2.
      for (const w of range(w1, w2)) {
        if (!put(warshToHafs, w, [h1])) return null;
      }
      if (!put(hafsToWarsh, h1, range(w1, w2))) return null;
      nextW += w2 - w1 + 1;
      nextH += 1;
    } else {
      return null; // multi-to-multi ranges are not part of the format
    }
  }

  const remaining = hafsTotal - nextH + 1;
  if (remaining < 0) return null;
  if (!fillIdentity(remaining)) return null;
  return { warshToHafs, hafsToWarsh };
}

const WARSH_TO_HAFS = new Map();
const HAFS_TO_WARSH = new Map();
const UNRELIABLE_SURAHS = new Set();

for (let s = 1; s <= 114; s += 1) {
  const maps = buildSurahMaps(s);
  if (!maps) {
    UNRELIABLE_SURAHS.add(s);
    continue;
  }
  WARSH_TO_HAFS.set(s, maps.warshToHafs);
  HAFS_TO_WARSH.set(s, maps.hafsToWarsh);
}

/**
 * Hafs verse numbers covered by one Warsh ayah (ascending). Usually one.
 * Returns null for unknown surahs, surahs without a reliable mapping, and
 * Warsh numbers beyond the surah's last ayah.
 */
export function warshToHafsNumbers(surah, warshAyah) {
  const s = Number(surah);
  const n = Number(warshAyah);
  if (!Number.isInteger(s) || s < 1 || s > 114 || !Number.isInteger(n) || n < 1) return null;
  if (UNRELIABLE_SURAHS.has(s)) return null;
  return WARSH_TO_HAFS.get(s).get(n) ?? null;
}

/**
 * Warsh ayah numbers that carry one Hafs verse. Returns [] for hafs ayahs
 * with no numbered Warsh counterpart (Al-Fatiha's basmala), null when the
 * coordinates are invalid or the surah mapping is unreliable.
 */
export function hafsToWarshNumbers(surah, hafsAyah) {
  const s = Number(surah);
  const n = Number(hafsAyah);
  if (!Number.isInteger(s) || s < 1 || s > 114 || !Number.isInteger(n) || n < 1) return null;
  if (UNRELIABLE_SURAHS.has(s)) return null;
  return HAFS_TO_WARSH.get(s).get(n) ?? null;
}

/**
 * True when both directions are derived from aligned segments for this
 * surah. Consumers use it to disable Hafs-keyed enrichment (translation,
 * tafsir, memorization) cleanly rather than misaligning verses.
 */
export function hasWarshHafsMapping(surah) {
  const s = Number(surah);
  return Number.isInteger(s) && s >= 1 && s <= 114 && !UNRELIABLE_SURAHS.has(s);
}

/**
 * Convenience for audio/scroll ranges: hafs bounds covering
 * warsh [from..to] (inclusive). Returns null when nothing maps.
 */
export function warshRangeToHafsRange(surah, warshFrom, warshTo) {
  let min = Infinity;
  let max = -Infinity;
  for (let n = Number(warshFrom); n <= Number(warshTo); n += 1) {
    const nums = warshToHafsNumbers(surah, n);
    if (!nums?.length) continue;
    if (nums[0] < min) min = nums[0];
    if (nums[nums.length - 1] > max) max = nums[nums.length - 1];
  }
  return Number.isFinite(min) ? [min, max] : null;
}
