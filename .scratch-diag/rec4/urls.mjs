import { getReciter, isSurahOnlyReciter } from "../../src/data/reciters.js";
import { buildUrlCandidates, isSurahStreamCdn } from "../../src/services/audioUrlBuilder.js";

for (const id of ["adel_al_kalbani", "mahmoud_ali_al_banna"]) {
  const rec = getReciter(id, "hafs");
  console.log(
    `${id}\n  cdnType=${rec.cdnType} audioMode=${rec.audioMode} surahOnly=${isSurahOnlyReciter(rec)} streamCdn=${isSurahStreamCdn(rec.cdnType)}\n  urls=${JSON.stringify(buildUrlCandidates(rec.cdn, { surah: 1, ayah: 1, hafsNumber: 1 }, rec.cdnType))}`,
  );
}
