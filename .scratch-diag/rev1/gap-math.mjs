import { buildSurahAudioPlaylist } from "../../src/utils/audioPlaylist.js";
import { filterAyahAudioGaps } from "../../src/data/audioAvailability.js";
import { expandAyahsToAudioFiles } from "../../src/utils/audioPlaylist.js";

const warsh = buildSurahAudioPlaylist(14, "warsh");
console.log("warsh entries:", warsh.length, "last displayed:", warsh.at(-1)?.numberInSurah);

const kept = filterAyahAudioGaps(warsh, "quranpedia", "266");
const dropped = warsh.filter((a) => !kept.includes(a)).map((a) => a.numberInSurah);
console.log("kept:", kept.length, "dropped displayed numbers:", dropped);

const files = expandAyahsToAudioFiles(kept, "quranpedia");
const map = new Map();
files.forEach((item, index) => {
  const key = `${item.surah}:${item.ayah ?? item.numberInSurah ?? "surah"}`;
  if (!map.has(key)) map.set(key, index);
});
const naiveIndexOf = (n) => warsh.findIndex((a) => a.numberInSurah === n);
for (const n of [1, 52, 53, 54]) {
  console.log(
    `verse ${n}: naiveIndex=${naiveIndexOf(n)} resolvedIndex=${map.get(`14:${n}`) ?? -1}`,
  );
}
console.log("files:", files.length, "displayed 54 present:", map.has("14:54"));
