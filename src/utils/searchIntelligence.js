import { latinToArabic } from "../data/transliteration.js";
import SURAHS, { getSurah } from "../data/surahs.js";
import { JUZ_DATA } from "../data/juz.js";

const ARABIC_DIACRITICS_RE =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const ARABIC_ONLY_RE = /[\u0600-\u06FF]/;
const PUNCTUATION_RE = /[.,/#!$%^&*;:{}=\-_`~()?"'،؛:!؟[\]\\|<>]/g;
const VOICE_FILLERS_RE =
  /\b(ابحث|ابحث عن|ابغا|أبغا|اريد|أريد|هات|اعرض|أعرض|قول|قل|سورة|سوره|آية|ايه|الآية|الاية|الاية رقم|رقم)\b/g;
const LATIN_FILLERS_RE =
  /\b(search|find|show|surah|sura|ayah|verse|please)\b/gi;

export function containsArabic(text = "") {
  return ARABIC_ONLY_RE.test(text);
}

export function sanitizeSearchQuery(input) {
  return String(input || "")
    .trim()
    .slice(0, 200)
    .replace(/[^\p{L}\p{N}\s\u0600-\u06FF'.,;:!?()\-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeArabicSearchText(text = "") {
  return text
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS_RE, "")
    .replace(/\u0640/g, "")
    .replace(PUNCTUATION_RE, " ")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Canonical fold for every search box: Latin accents, Arabic tashkeel and the
 * alef/ya/ha spelling variants are all reduced, so one query behaves the same
 * whether it is typed in the directory, the home tabs or the reciter library.
 * A word-final h after a vowel is dropped because readers type the aspirated
 * transliteration ("fatihah") while the dataset stores the short form
 * ("Al-Fatiha"); queries and records are folded the same way.
 * Doubled Latin letters are then collapsed: "Minshawwi", "Shaatiri" and
 * "Abdulbassit" are how readers spell a sound they never saw transliterated,
 * and the catalogue stores one spelling each. Arabic is untouched.
 */
export function foldSearchText(value) {
  return normalizeArabicSearchText(
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase(),
  )
    .replace(/([aeiou])h(?=$|\s)/g, "$1")
    .replace(/([a-z])\1+/g, "$1");
}

// The 114 surah records are static, so each haystack is folded once here rather
// than on every keystroke in every search box.
const SURAH_DIRECTORY = SURAHS.map((surah) => ({
  surah,
  haystack: foldSearchText(`${surah.n} ${surah.ar} ${surah.en} ${surah.fr}`),
}));

/**
 * The one matching rule behind every surah search box: a digits-only query
 * narrows by number prefix, anything else must match every term the user typed.
 */
export function filterSurahDirectory(query = "") {
  const folded = foldSearchText(toLatinDigits(String(query || "")));
  if (!folded) return SURAH_DIRECTORY.map(({ surah }) => surah);
  if (/^\d+$/.test(folded)) {
    return SURAH_DIRECTORY.filter(({ surah }) =>
      String(surah.n).startsWith(folded),
    ).map(({ surah }) => surah);
  }
  const terms = folded.split(" ").filter(Boolean);
  return SURAH_DIRECTORY.filter(({ haystack }) =>
    terms.every((term) => haystack.includes(term)),
  ).map(({ surah }) => surah);
}

export function sanitizeVoiceTranscript(transcript = "") {
  const cleaned = transcript
    .normalize("NFKC")
    .replace(VOICE_FILLERS_RE, " ")
    .replace(LATIN_FILLERS_RE, " ")
    .replace(PUNCTUATION_RE, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned;
}

function pushCandidate(target, value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, " ");
  if (cleaned.length >= 2) target.push(cleaned);
}

function addPrefixCandidates(target, value, maxWords = 8) {
  const words = value.split(/\s+/).filter(Boolean);
  for (let count = Math.min(maxWords, words.length); count >= 2; count -= 1) {
    pushCandidate(target, words.slice(0, count).join(" "));
  }
}

export function inferSearchMode(rawQuery = "", preferredMode = "arabic") {
  if (containsArabic(rawQuery)) return "arabic";
  if (preferredMode === "fr" || preferredMode === "en") return preferredMode;
  return "phonetic";
}

export function buildSearchCandidates(rawQuery = "", mode = "arabic") {
  const base = sanitizeVoiceTranscript(rawQuery);
  const candidates = [];
  pushCandidate(candidates, base);

  if (mode === "fr" || mode === "en") {
    addPrefixCandidates(candidates, base, 10);
    return [...new Set(candidates)];
  }

  const normalizedArabic = normalizeArabicSearchText(base);
  pushCandidate(candidates, normalizedArabic);
  addPrefixCandidates(candidates, normalizedArabic, 8);

  if (!containsArabic(base) || mode === "phonetic") {
    const transliterated = latinToArabic(base);
    if (transliterated && transliterated !== base) {
      const normalizedTransliterated = normalizeArabicSearchText(transliterated);
      pushCandidate(candidates, transliterated);
      pushCandidate(candidates, normalizedTransliterated);
      addPrefixCandidates(candidates, normalizedTransliterated, 8);
    }
  }

  return [...new Set(candidates)];
}

export function toLatinDigits(text = "") {
  return String(text)
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

const SURAH_KEYWORD_RE = /^(?:surah|sura|sourate|sourat|سورة|سوره)\s+(\d{1,3})$/i;
const JUZ_KEYWORD_RE = /^(?:juz|juzza|ajza|partie|الجزء|جزء|جز)\s+(\d{1,3})$/i;
const AYAH_REFERENCE_RE = /^(\d{1,3})\s*[:.]\s*(\d{1,3})$/;
const BARE_SURAH_RE = /^(\d{1,3})$/;

const MAX_JUZ = JUZ_DATA.length;

function toPositiveInt(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function ayahCount(surah) {
  return getSurah(surah)?.ayahs || 0;
}

/**
 * Read a query whose intent is a position in the mushaf rather than a word:
 * "36", "2:10", "sourate 36", "juz 5", "٢:١٠". Returns null when the query is
 * out of range or not a reference, so the caller keeps text search.
 */
export function parseSearchReference(rawQuery = "") {
  const value = toLatinDigits(String(rawQuery || ""))
    .replace(/\s+/g, " ")
    .trim();
  if (!value) return null;

  const juzKeyword = value.match(JUZ_KEYWORD_RE);
  if (juzKeyword) {
    const juz = toPositiveInt(juzKeyword[1]);
    return juz >= 1 && juz <= MAX_JUZ ? { kind: "juz", juz } : null;
  }

  const surahKeyword = value.match(SURAH_KEYWORD_RE);
  if (surahKeyword) {
    const surah = toPositiveInt(surahKeyword[1]);
    return ayahCount(surah) ? { kind: "surah", surah, ayah: 1 } : null;
  }

  const ayahReference = value.match(AYAH_REFERENCE_RE);
  if (ayahReference) {
    const surah = toPositiveInt(ayahReference[1]);
    const ayah = toPositiveInt(ayahReference[2]);
    const count = ayahCount(surah);
    return count && ayah >= 1 && ayah <= count ? { kind: "ayah", surah, ayah } : null;
  }

  const bareSurah = value.match(BARE_SURAH_RE);
  if (bareSurah) {
    const surah = toPositiveInt(bareSurah[1]);
    return ayahCount(surah) ? { kind: "surah", surah, ayah: 1 } : null;
  }

  return null;
}
