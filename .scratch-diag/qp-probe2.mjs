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
// FR translation content sample
const frTr = await get("/translation/1949/2/255");
console.log("FR 2:255:", JSON.stringify(frTr).slice(0, 300));
const enTr = await get("/translation/13661/1/1");
console.log("ClearQuran 1:1:", JSON.stringify(enTr).slice(0, 250));
// e3rab: find book via ayah options -> try categories books for tafsir/e3rab
const st = await get("/surah/tafsirs/1");
console.log("surah tafsirs keys:", st ? Object.keys(st).slice(0, 8) : null, JSON.stringify(st).slice(0, 400));
const cats = await get("/categories/books");
console.log("categories:", JSON.stringify(cats).slice(0, 800));
// reciters: Warsh ones
const rec = await get("/reciters");
const arr = rec?.reciters || rec?.data || rec || [];
const warsh = arr.filter((r) => /ورش/.test(r.rawi?.name || ""));
console.log("WARSH reciters:", warsh.length);
for (const w of warsh.slice(0, 12)) console.log("-", w.id, w.name, "| server:", w.server, "| class:", w.classification?.name, "| timing:", w.timing_url ? "yes" : "no", "| surahs:", w.surahs_list?.length);
const hafsIds = new Set(arr.filter((r) => /حفص/.test(r.rawi?.name || "")).map((r) => r.name.replace(/مصحف\s/, "").replace(/\sبرواية.*$/, "")));
console.log("distinct HAFS reciter names:", hafsIds.size);
