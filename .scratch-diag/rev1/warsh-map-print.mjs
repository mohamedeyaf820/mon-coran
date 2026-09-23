import { warshToHafsNumbers } from "../../src/data/warshHafsNumbering.js";
import { getWarshSurahAyahCount } from "../../src/constants/warshSource.js";

for (const s of [1, 2, 5, 93, 94]) {
  const t = getWarshSurahAyahCount(s);
  const rows = [];
  for (let w = 1; w <= t; w++) rows.push(`${w}:[${(warshToHafsNumbers(s, w) || []).join(",")}]`);
  console.log(`surah ${s} (hafs ${s === 1 ? 7 : "?"}) warshTotal=${t}`);
  console.log("  " + rows.join(" "));
}
