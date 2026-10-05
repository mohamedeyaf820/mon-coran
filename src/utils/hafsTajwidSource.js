import { getAyahTextForFont, stripEmbeddedAyahMarkers } from "../data/fonts.js";
import { stripBasmala } from "./quranUtils.js";
import { normalizeTajwidAnnotation } from "./tajwidAnnotation.js";
import { hasCoherentWordData } from "./wordCoherence.js";
import { splitTajwidIntoWords } from "./tajwidWords.js";

/** One canonical verse and one annotation policy for every Hafs surface. */
export function getHafsTajwidSource(ayah, fontFamily, surahNum = ayah?.surah?.number) {
  const original = stripEmbeddedAyahMarkers(stripBasmala(
    getAyahTextForFont(ayah, fontFamily, "hafs"), surahNum, ayah.numberInSurah,
  ), { ayahNumber: ayah.numberInSurah });
  const annotation = ayah.quranCom?.textTajweed || ayah.words
    ?.filter(word => (word.charType || word.charTypeName || word.char_type_name) !== "end")
    .map(word => word.textTajweed || word.textUthmani || word.text)
    .filter(Boolean).join(" ") || null;
  const normalized = normalizeTajwidAnnotation(original, annotation);
  return { original, annotation, ...normalized, words: splitTajwidIntoWords(normalized.segments).words, wordAudioIsAligned: hasCoherentWordData(ayah.words, original, fontFamily, "hafs", surahNum, ayah.numberInSurah) };
}
