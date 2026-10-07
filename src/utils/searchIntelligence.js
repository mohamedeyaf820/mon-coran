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
    .replace(/[^\p{L}\p{N}\s\u0600-\u06FF'.,;:!?()-]/gu, "")
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

const SURAH_NAME_KEYWORD_RE =
  /^(?:surah|sura|sourate|surate|\u0633\u0648\u0631\u0629|\u0633\u0648\u0631\u0647)\s+/i;
const LATIN_NAME_ARTICLES = [
  "al", "a", "az", "as", "ad", "ar", "ash", "au", "aw", "an", "the",
];
const FRENCH_NAME_ARTICLES = [
  "la", "le", "les", "l", "un", "une", "des", "du",
];
const ARABIC_DEFIMATE = "ال";

function nameScript(value) {
  if (/^\p{Script=Arabic}+$/u.test(value)) return "arabic";
  if (/\p{Script=Arabic}/u.test(value)) return "mixed";
  return "latin";
}

/**
 * Names are stored with an article in three languages ("Al-Baqara", "La Vache",
 * "البقرة") while readers type the bare word, so each name is indexed both with
 * and without its article. An apostrophe is a word boundary here, not a letter.
 */
function foldSurahName(value) {
  return foldSearchText(value)
    .replace(/['’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripNameArticle(folded, script) {
  const articles =
    script === "latin"
      ? [...LATIN_NAME_ARTICLES, ...FRENCH_NAME_ARTICLES]
      : LATIN_NAME_ARTICLES;
  const words = folded.split(" ");
  if (words.length > 1 && articles.includes(words[0])) {
    return words.slice(1).join(" ");
  }
  if (script !== "latin" && folded.startsWith(ARABIC_DEFIMATE) && folded.length > 3) {
    return folded.slice(ARABIC_DEFIMATE.length);
  }
  return folded;
}

const SURAH_NAME_INDEX = (() => {
  const index = new Map();
  for (const surah of SURAHS) {
    for (const name of [surah.ar, surah.en, surah.fr]) {
      const folded = foldSurahName(name);
      const keys = new Set([folded, stripNameArticle(folded, nameScript(name))]);
      for (const key of keys) {
        if (!index.has(key)) index.set(key, new Set());
        index.get(key).add(surah.n);
      }
    }
  }
  return index;
})();

/**
 * The reader's other way to name a place in the mushaf: type the surah itself
 * ("البقرة", "vache", "sourate La Vache", "Fatiha"). Returns the surah only when
 * the query is exactly one surah name, so a word search keeps its verses;
 * "L'Ouverture" belongs to two surahs in this data and returns null rather than
 * guessing.
 */
export function findSurahByName(rawQuery = "") {
  const folded = foldSurahName(
    String(rawQuery || "").replace(SURAH_NAME_KEYWORD_RE, "").trim(),
  );
  if (folded.length < 2 || /^\d+$/.test(folded)) return null;
  const script = nameScript(folded);
  const matches =
    SURAH_NAME_INDEX.get(folded) ||
    SURAH_NAME_INDEX.get(stripNameArticle(folded, script));
  return matches && matches.size === 1 ? getSurah([...matches][0]) : null;
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

// Each candidate is a request to the search API, and a query that matches
// nothing walks all of them. Long dictated sentences therefore stop being
// narrowed after this many words: the shorter prefixes that follow carry no
// more meaning than the fifth one already did.
const MAX_PHRASE_CANDIDATES = 5;

function addPrefixCandidates(target, value, maxWords = MAX_PHRASE_CANDIDATES) {
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
    addPrefixCandidates(candidates, base);
    return [...new Set(candidates)];
  }

  const normalizedArabic = normalizeArabicSearchText(base);
  pushCandidate(candidates, normalizedArabic);
  addPrefixCandidates(candidates, normalizedArabic);

  if (!containsArabic(base) || mode === "phonetic") {
    const transliterated = latinToArabic(base);
    if (transliterated && transliterated !== base) {
      const normalizedTransliterated = normalizeArabicSearchText(transliterated);
      pushCandidate(candidates, transliterated);
      pushCandidate(candidates, normalizedTransliterated);
      addPrefixCandidates(candidates, normalizedTransliterated);
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

const FRENCH_WORDS = new Set([
  "le", "la", "les", "un", "une", "des", "du", "de", "et", "est", "qui", "que", "quoi", "il", "elle", "ils", "nous", "vous",
  "dans", "pour", "par", "sur", "avec", "sans", "ne", "pas", "tout", "tous", "toute", "très", "au", "aux", "ce", "cette",
  "son", "sa", "ses", "leur", "dieu", "seigneur", "miséricordieux", "misericordieux", "miséricorde", "misericorde",
  "louange", "paix", "serviteurs", "jour", "terre", "ciel", "croyants", "gens", "homme", "hommes",
]);
const ENGLISH_WORDS = new Set([
  "the", "and", "of", "is", "are", "who", "you", "your", "he", "she", "they", "we", "us", "in", "to", "for", "with", "not",
  "all", "his", "her", "their", "that", "this", "lord", "god", "merciful", "mercy", "praise", "peace", "servants", "day",
  "earth", "heavens", "believers", "people", "man", "men", "most", "gracious", "worship",
]);
const FRENCH_ACCENT_RE = /[éèêëàâçùûîïôœ]/i;
// Sounds a French or English word almost never carries but a transliterated
// Arabic one does: doubled long vowels, emphatic digraphs, the definite article.
const PHONETIC_HINT_RE = /(dh|kh|gh|sh(?!e)|aa|ii|uu|ou[a-z]*ah\b|ullah|llah|rahman|rahim|bismi|^al[- ]?[a-z]|\bal-[a-z]|^ar[- ]|^an[- ]|\bash[- ]|['’`]a)/i;

/**
 * Guess what a Latin-script query is: a transliteration of the Arabic text
 * ("bismillahirrahmanirrahim", "kulhuallah"), a French phrase or an English one.
 * The result only orders the sources to try first; every source is still asked,
 * so a wrong guess costs a little rank, never a missing result.
 */
export function guessLatinQueryKind(rawQuery = "") {
  const text = String(rawQuery || "").trim().toLowerCase();
  if (!text) return "unknown";
  const words = text.split(/[^\p{L}'’-]+/u).filter(Boolean);
  let french = FRENCH_ACCENT_RE.test(text) ? 1 : 0;
  let english = 0;
  let phonetic = PHONETIC_HINT_RE.test(text) ? 1 : 0;
  for (const word of words) {
    if (FRENCH_WORDS.has(word)) french += 1;
    if (ENGLISH_WORDS.has(word)) english += 1;
  }
  // A single long run of letters with no space is a spelled-out Arabic phrase.
  if (words.length === 1 && words[0].length >= 12 && !FRENCH_WORDS.has(words[0]) && !ENGLISH_WORDS.has(words[0])) phonetic += 1;
  const best = Math.max(french, english, phonetic);
  if (best === 0) return "unknown";
  if (phonetic === best && french < best && english < best) return "phonetic";
  if (french === best && french > english) return "fr";
  if (english === best && english > french) return "en";
  return phonetic >= 1 ? "phonetic" : "unknown";
}

/** The order in which to prefer the sources of a Latin-script query. */
export function latinSourceOrder(kind, interfaceLanguage = "fr") {
  const own = interfaceLanguage === "en" ? ["en", "fr"] : ["fr", "en"];
  if (kind === "fr") return ["fr", "en", "phonetic"];
  if (kind === "en") return ["en", "fr", "phonetic"];
  if (kind === "phonetic") return ["phonetic", ...own];
  return ["phonetic", ...own];
}
