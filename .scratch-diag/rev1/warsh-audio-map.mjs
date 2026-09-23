import SURAHS from "../../src/data/surahs.js";
import { warshToHafsNumbers, hasWarshHafsMapping } from "../../src/data/warshHafsNumbering.js";
import { getWarshSurahAyahCount } from "../../src/constants/warshSource.js";

let mergeSurahs = 0, mergeItems = 0, dupSurahs = 0, dupItems = 0, nullItems = 0;
const dupExamples = [];
const mergeExamples = [];

for (let s = 1; s <= 114; s++) {
  const wTotal = getWarshSurahAyahCount(s);
  if (!wTotal) continue;
  let firstOfSurah = null;
  let prevHafs = null;
  for (let w = 1; w <= wTotal; w++) {
    const h = warshToHafsNumbers(s, w) ?? null;
    if (!h) { nullItems++; prevHafs = null; continue; }
    const first = h[0];
    if (h.length > 1) { mergeItems++; if (mergeExamples.length < 8) mergeExamples.push(`${s}:${w} -> ${h.join(",")}`); }
    if (prevHafs !== null && first === prevHafs) {
      dupItems++;
      if (firstOfSurah === null) { dupSurahs++; firstOfSurah = s; }
      if (dupExamples.length < 15) dupExamples.push(`surah ${s} warsh ${w-1},${w} -> hafs ${first}`);
    }
    prevHafs = first;
  }
  if (firstOfSurah !== null) mergeSurahs++;
}

const hafsTotal = SURAHS.reduce((a, x) => a + x.ayahs, 0);
const warshTotal = Array.from({ length: 114 }, (_, i) => getWarshSurahAyahCount(i + 1)).reduce((a, b) => a + b, 0);
console.log({ hafsTotal, warshTotal, mergeItems, dupItems, dupSurahs, nullItems });
console.log("merges:", mergeExamples.join(" | "));
console.log("dups:", dupExamples.join(" | "));
