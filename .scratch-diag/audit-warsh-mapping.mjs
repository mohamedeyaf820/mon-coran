import io from "node:fs";
import { warshToHafsNumbers, hafsToWarshNumbers, WARSH_HAFS_SEGMENTS } from "../src/data/warshHafsNumbering.js";
import SURAHS from "../src/data/surahs.js";

// Audit 1: does the offline Warsh translation carry exactly the mapping the
// reader's own numbering table computes? (Use the app's implementation: a
// re-derived sparse lookup is the documented wrong answer.)
const manifest = JSON.parse(io.readFileSync("public/data/warsh-translation-fr/index.json", "utf8"));
const hafsTotalBySurah = new Map(SURAHS.map((s) => [s.n, s.ayahs]));

let checked = 0;
let mismatches = [];
let dupOk = 0;
let dupBad = [];
let missing = [];
let notDense = [];
let warshTotal = 0;

for (const fname of Object.keys(manifest.files).sort()) {
  const surah = Number(fname.split(".")[0]);
  const data = JSON.parse(io.readFileSync(`public/data/warsh-translation-fr/${fname}`, "utf8"));
  const ayahs = data.ayahs;
  warshTotal += ayahs.length;
  const covered = [];
  if (ayahs.map((a) => a.ayah_number).join(",") !== Array.from({ length: ayahs.length }, (_, i) => i + 1).join(",")) {
    notDense.push(surah);
  }
  for (const a of ayahs) {
    const expected = warshToHafsNumbers(surah, a.ayah_number);
    checked += 1;
    if (JSON.stringify(a.hafs_numbers) !== JSON.stringify(expected)) {
      if (mismatches.length < 12) mismatches.push([surah, a.ayah_number, a.hafs_numbers, expected]);
      else mismatches.push(null);
    }
    covered.push(...a.hafs_numbers);
  }
  const hTotal = hafsTotalBySurah.get(surah);
  const gap = [];
  const seen = new Set();
  for (const h of covered) {
    if (seen.has(h)) {
      // A Hafs verse may legitimately appear twice only where the table splits
      // one Hafs ayah into several Warsh ayahs.
      const split = (WARSH_HAFS_SEGMENTS[surah] || []).some(([w1, w2, h1, h2]) => w1 != null && h1 === h2 && w2 > w1 && h1 <= h && h <= h2);
      if (split) dupOk += 1;
      else dupBad.push([surah, h]);
    }
    seen.add(h);
  }
  for (let h = 1; h <= hTotal; h += 1) if (!seen.has(h)) gap.push(h);
  if (gap.length) missing.push([surah, gap.slice(0, 6)]);
}

console.log(
  JSON.stringify(
    {
      checked,
      warshTotalInData: warshTotal,
      declaredWarshTotal: manifest.numberingAdaptation.warshTotalAyahs,
      hafsTotalFromApp: SURAHS.reduce((n, s) => n + s.ayahs, 0),
      mismatches: mismatches.length ? mismatches : 0,
      duplicatedHafsAllowed: dupOk,
      duplicatedHafsUnexpected: dupBad.slice(0, 8),
      hafsVersesNeverCovered: missing.slice(0, 8),
      nonDenseWarshNumbering: notDense,
    },
    null,
    1,
  ),
);

// Audit 2: the reverse direction used by search and audio — every Hafs verse a
// Warsh reader could land on must map back to a Warsh verse.
let reverseBad = 0;
for (const s of SURAHS) {
  for (let h = 1; h <= s.ayahs; h += 1) {
    const w = hafsToWarshNumbers(s.n, h);
    if (!Array.isArray(w) || !w.length) {
      // Legitimate only where a Hafs ayah has no numbered Warsh counterpart
      // (the Fatiha basmala), which the table records as [null,null,h,h].
      const ornamental = (WARSH_HAFS_SEGMENTS[s.n] || []).some(([w1, w2, h1, h2]) => w1 == null && h1 <= h && h <= h2);
      if (!ornamental) {
        if (reverseBad < 8) console.log("  reverse gap", s.n, h);
        reverseBad += 1;
      }
    }
  }
}
console.log("reverse (hafs->warsh) gaps:", reverseBad);
