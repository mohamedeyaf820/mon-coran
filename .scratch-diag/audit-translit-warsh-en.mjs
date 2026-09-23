import io from "node:fs";
import SURAHS from "../src/data/surahs.js";

// Audit 3: the EN word-by-word transliteration is Hafs-keyed. Check it tiles
// 1..hafsTotal per surah with no hole, and that the EN Warsh translation carries
// the same Warsh->Hafs mapping as the FR one.
function checkTranslit() {
  const manifest = JSON.parse(io.readFileSync("public/data/transliteration-en/index.json", "utf8"));
  const out = { riwaya: manifest.edition.riwaya, surahs: 0, missing: [], short: [], extra: [], verses: 0 };
  for (const s of SURAHS) {
    const f = `${String(s.n).padStart(3, "0")}.json`;
    if (!manifest.files[f]) {
      out.missing.push(s.n);
      continue;
    }
    const data = JSON.parse(io.readFileSync(`public/data/transliteration-en/${f}`, "utf8"));
    const ayahs = data.ayahs ?? data;
    const nums = new Set(
      (Array.isArray(ayahs) ? ayahs : Object.entries(ayahs).map(([k, v]) => ({ ayah_number: k, ...(v || {}) }))).map(
        (a) => Number(a.ayah_number ?? a.ayah ?? a.numberInSurah),
      ),
    );
    out.surahs += 1;
    out.verses += nums.size;
    const gaps = [];
    for (let h = 1; h <= s.ayahs; h += 1) if (!nums.has(h)) gaps.push(h);
    if (gaps.length) out.short.push([s.n, gaps.slice(0, 4), gaps.length]);
    const extra = [...nums].filter((n) => n > s.ayahs || n < 1);
    if (extra.length) out.extra.push([s.n, extra.slice(0, 4)]);
  }
  return out;
}

function checkWarshEn() {
  const m = JSON.parse(io.readFileSync("public/data/warsh-translation-en/index.json", "utf8"));
  const mf = JSON.parse(io.readFileSync("public/data/warsh-translation-fr/index.json", "utf8"));
  let diff = 0;
  const samples = [];
  for (const fname of Object.keys(m.files)) {
    const en = JSON.parse(io.readFileSync(`public/data/warsh-translation-en/${fname}`, "utf8"));
    const fr = JSON.parse(io.readFileSync(`public/data/warsh-translation-fr/${fname}`, "utf8"));
    const enMap = new Map(en.ayahs.map((a) => [a.ayah_number, a.hafs_numbers.join(",")]));
    for (const a of fr.ayahs) {
      if (enMap.get(a.ayah_number) !== a.hafs_numbers.join(",")) {
        diff += 1;
        if (samples.length < 6) samples.push([Number(fname.split(".")[0]), a.ayah_number, a.hafs_numbers, enMap.get(a.ayah_number)]);
      }
    }
  }
  return { enAyahs: Object.keys(m.files).length, mappingDiffersFromFr: diff, samples, riwaya: m.edition.riwaya };
}

console.log("transliteration:", JSON.stringify(checkTranslit(), null, 1));
console.log("warsh-en:", JSON.stringify(checkWarshEn(), null, 1));
