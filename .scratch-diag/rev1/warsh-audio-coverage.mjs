import SURAHS from "../../src/data/surahs.js";
import { buildSurahAudioPlaylist } from "../../src/utils/audioPlaylist.js";

let never = 0, dupItems = 0, total = 0;
const rows = [];
for (let s = 1; s <= 114; s++) {
  const hafsTotal = SURAHS[s - 1].ayahs;
  const pl = buildSurahAudioPlaylist(s, "warsh");
  total += pl.length;
  const counts = new Map();
  for (const x of pl) counts.set(x.hafsNumber, (counts.get(x.hafsNumber) || 0) + 1);
  const dups = [...counts.entries()].filter(([, c]) => c > 1);
  dupItems += dups.reduce((a, [, c]) => a + c - 1, 0);
  const used = new Set(counts.keys());
  const missing = [];
  for (let h = 1; h <= hafsTotal; h++) if (!used.has(h)) missing.push(h);
  const basmala = s === 1 && missing[0] === 1;
  const real = missing.slice(basmala ? 1 : 0);
  never += real.length;
  if (real.length || dups.length)
    rows.push(`s${s}: warshItems=${pl.length} hafsTotal=${hafsTotal} missing=[${real.join(",")}] dupFiles=[${dups.map(([h, c]) => h + "x" + c).join(",")}]`);
}
console.log(`warsh playlist items=${total} (hafs total ${SURAHS.reduce((a, x) => a + x.ayahs, 0)})`);
console.log(`Hafs audio files never played (excl. Al-Fatiha basmala): ${never}`);
console.log(`Redundant playlist items pointing at an already-played file: ${dupItems}`);
console.log(rows.slice(0, 20).join("\n"));
