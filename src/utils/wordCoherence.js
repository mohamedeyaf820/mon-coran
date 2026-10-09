import { NATIVE_AYAH_MARKER_RE, getQuranWordTextForFont } from "../data/fonts.js";
import { comparableArabicText } from "./quranUtils.js";

const AYAH_MARKER_TOKEN_RE =
  /^[\u06dd\u06de\u06e9\uFC00-\uFD1C\ufd3f\ufd3e\d\u0660-\u0669\u06f0-\u06f9]+$/u;

export function isAyahMarkerToken(word) {
  if (!word) return false;
  const compact = String(word).replace(/\s+/g, "");
  if (!compact) return false;
  return AYAH_MARKER_TOKEN_RE.test(compact) || NATIVE_AYAH_MARKER_RE.test(compact);
}

export function splitRecitableWords(text) {
  return String(text || "")
    .split(/\s+/u)
    .filter((token) => token.length > 0 && !isAyahMarkerToken(token));
}

export function hasCoherentWordData(
  words,
  text,
  fontFamily,
  riwaya,
  surahNum,
  ayahNumber,
) {
  if (!Array.isArray(words) || words.length === 0) return false;
  const expected = comparableArabicText(splitRecitableWords(text).join(" "));
  const actual = comparableArabicText(
    words.map((word) => getQuranWordTextForFont(word, fontFamily, riwaya)).join(" "),
  );

  if (!expected || !actual || expected !== actual) return false;

  return words.every((word) => {
    const wordSurah = Number(word?.surah);
    const wordAyah = Number(word?.ayah);
    const hasSurahIdentity = Number.isFinite(wordSurah) && wordSurah > 0;
    const hasAyahIdentity = Number.isFinite(wordAyah) && wordAyah > 0;

    return (
      (!hasSurahIdentity || wordSurah === Number(surahNum)) &&
      (!hasAyahIdentity || wordAyah === Number(ayahNumber))
    );
  });
}
