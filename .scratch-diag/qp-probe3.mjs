const B = "https://api.quranpedia.net/v1";
async function get(p, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(B + p, { headers: { "user-agent": "MushafPlus/1.0" } });
      const t = await r.text();
      try { return JSON.parse(t); } catch { await new Promise((s) => setTimeout(s, 1200)); }
    } catch { await new Promise((s) => setTimeout(s, 1200)); }
  }
  return null;
}
const rec = await get("/reciters");
const nested = rec?.reciters || rec?.data || rec || [];
const flat = Array.isArray(nested) ? nested.flat(2) : [];
console.log("total reciter entries:", flat.length);

const warsh = flat.filter((r) => /ورش/.test(r?.rawi?.name || ""));
console.log("\nWARSH reciters:", warsh.length);
for (const w of warsh) {
  console.log(`- id=${w.id} name=${w.name} | server=${w.server} | class=${w.classification?.name} | surahs=${w.surahs_list?.length ?? "?"} | timing=${w.timing_url || "none"}`);
}

const hafs = flat.filter((r) => /حفص/.test(r?.rawi?.name || ""));
console.log("\nHAFS reciters:", hafs.length);
const names = new Set(hafs.map((r) => r.name));
for (const r of hafs.slice(0, 60)) console.log(`- id=${r.id} ${r.name} | server=${r.server} | class=${r.classification?.name}`);

// sample per-ayah (حسب الآيات) reciter for both rawis
const perAyah = flat.filter((r) => r?.classification?.name === "حسب الآيات");
console.log("\nper-ayah classified count:", perAyah.length);
for (const r of perAyah.slice(0, 10)) console.log(`- id=${r.id} ${r.name} rawi=${r.rawi?.name} server=${r.server}`);

// HEAD-test audio URL patterns
async function head(url) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    return `${r.status} ${r.headers.get("content-type")} ${r.headers.get("content-length") || "?"}B`;
  } catch (e) { return "ERR " + e.message; }
}
const surahClass = flat.find((r) => r?.classification?.name === "حسب السور" && r?.rawi?.name?.includes("ورش"));
const ayahClass = flat.find((r) => r?.classification?.name === "حسب الآيات" && r?.rawi?.name?.includes("ورش"));
if (surahClass) {
  const base = surahClass.server.replace(/\/$/, "");
  console.log("\nWARSH per-surah server:", base);
  for (const u of [`${base}/001.mp3`, `${base}/001.mp3`.replace(".mp3", "") + ".mp3", `${base}/01.mp3`, `${base}/surah-001.mp3`]) {
    console.log(" HEAD", u, "=>", await head(u));
  }
}
if (ayahClass) {
  const base = ayahClass.server.replace(/\/$/, "");
  console.log("\nWARSH per-ayah server:", base);
  for (const u of [`${base}/001001.mp3`, `${base}/1/1.mp3`, `${base}/001_001.mp3`, `${base}/01_001.mp3`]) {
    console.log(" HEAD", u, "=>", await head(u));
  }
}
// font
try {
  const r = await fetch("https://quranpedia.net/assets/fonts/arabic/UthmanicWarsh_V21.ttf", { method: "HEAD" });
  console.log("\nFont UthmanicWarsh_V21.ttf:", r.status, r.headers.get("content-type"), r.headers.get("content-length"));
} catch (e) { console.log("font err", e.message); }
