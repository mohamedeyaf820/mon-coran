import { getRecitersByRiwaya } from "../../src/data/reciters.js";
import { foldSearchText } from "../../src/utils/searchIntelligence.js";

const list = getRecitersByRiwaya("hafs");
const fields = (r) =>
  [r.nameFr, r.nameEn, r.name, (r.searchAliases || []).join(" ")].map(foldSearchText);

for (const q of [
  "albanna", "al banna", "banna", "al-banna", "mahmoud banna", "mahmoud ali al banna",
  "kalbani", "kalbanni", "al kalbani", "adel kalbani", "كلباني",
]) {
  const n = foldSearchText(q);
  const hits = list.filter((r) => fields(r).some((f) => f.includes(n)));
  console.log(`"${q}" ->`, hits.length ? hits.map((h) => h.id).join(", ") : "NO RESULT");
}
