const res = await fetch("https://api.quranpedia.net/v1/reciters");
const nested = await res.json();
const reciters = nested.flat(2).filter((r) => r && r.id);
const hafs = reciters.filter((r) => (r.rawi?.name || "").includes("حفص"));
const lines = hafs.map((r) => [
  r.id,
  (r.name || "").replace(/\s+/g, " "),
  r.classification?.name === "حسب الآيات" ? "ayah" : r.classification?.name === "حسب السور" ? "surah" : "?",
  Array.isArray(r.surahs_list) ? r.surahs_list.length : -1,
  (r.server || "").replace(/^https?:\/\//, "").replace(/\/+$/, ""),
].join("\t"));
console.log(lines.join("\n"));
console.error("total hafs:", hafs.length, "ayah-mode:", lines.filter((l) => l.includes("\tayah\t")).length);
