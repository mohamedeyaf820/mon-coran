import { latinToArabic } from "../data/transliteration";

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
