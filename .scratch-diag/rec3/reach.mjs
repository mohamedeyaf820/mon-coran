import { getRecitersByRiwaya } from "../../src/data/reciters.js";
import { foldSearchText } from "../../src/utils/searchIntelligence.js";

const list = getRecitersByRiwaya("hafs");
const favorites = new Set();
const sorted = [...list].sort((a, b) => {
  const aFav = favorites.has(a.id) ? 1 : 0;
  const bFav = favorites.has(b.id) ? 1 : 0;
  if (aFav !== bFav) return bFav - aFav;
  const aP = Number(a.cataloguePriority || 0);
  const bP = Number(b.cataloguePriority || 0);
  if (aP !== bP) return bP - aP;
  return String(a.nameFr || a.nameEn || a.name).localeCompare(
    String(b.nameFr || b.nameEn || b.name),
  );
});

console.log("position in the hub list (1-based):");
for (const id of ["ar.minshawi", "ar.minshawimujawwad", "husary_muallim"]) {
  console.log(" ", id, sorted.findIndex((r) => r.id === id) + 1, "of", sorted.length);
}
console.log("first 8 (initial window):", sorted.slice(0, 8).map((r) => r.id).join(", "));

const queries = ["minshawwi", "minshawi", "Minshawy", "kalbanni", "kalbany", "albanna", "basfar", "basfr"];
console.log("\nsearch results:");
for (const qRaw of queries) {
  const q = foldSearchText(qRaw);
  const hits = list.filter((r) =>
    [r.nameFr, r.nameEn, r.name, (r.searchAliases || []).join(" ")]
      .map(foldSearchText)
      .some((f) => f.includes(q)),
  );
  console.log(`  "${qRaw}" ->`, hits.length ? hits.map((h) => h.id).join(", ") : "NO RESULT");
}
