/*
 * Display clean-up for the Arabic of Hisn al-Muslim. The source files carry
 * typesetting leftovers that the Quran faces draw as stray signs: "*" between
 * verses, a full stop after the closing ornate bracket, tatweel, isolated
 * presentation forms (U+FE70..FEFF) and unvowelled formulas inside vowelled
 * text. The letters and vowels of the invocation itself are never changed.
 */

const BASMALA = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
const SALAWAT = "صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ";
const PRESENTATION_FORMS = /[\uFE70-\uFEFF]/gu;
// A tatweel that carries a hamza or a small waw/yeh (as in "فَـَٔامَنَّا") is part of the spelling and stays.
const TATWEEL = /\u0640(?![\u064B-\u0652]*[\u0654\u0655\u06E5\u06E6])/gu;
// "*" separates the verses of a quoted sura; "." right after an ornate bracket is a sentence end already shown by the bracket.
const VERSE_STAR = /\s*\*\s*/gu;
const DOT_AFTER_BRACKET = /(\uFD3E)\s*\./gu;
const SPACE_AFTER_COLON = /:(?=[ء-ي])/gu;
const INNER_BRACKET_SPACE = /([([])\s+|\s+([)\]])/gu;
// Word joiners keep an opening or closing bracket on the same line as its word.
const WORD_JOINER = "\u2060";

export function cleanDuaArabic(value) {
  return String(value || "")
    .replace(PRESENTATION_FORMS, (char) => char.normalize("NFKC"))
    .replace(TATWEEL, "")
    .replace(VERSE_STAR, " ")
    .replace(DOT_AFTER_BRACKET, "$1")
    .replace(SPACE_AFTER_COLON, ": ")
    .replace(INNER_BRACKET_SPACE, (match, open, close) => open || close)
    .replace(/بسم الله الرحمن الرحيم/gu, BASMALA)
    .replace(/صلى الله عليه وسلم/gu, SALAWAT)
    .replace(/([([])(?=\S)/gu, `$1${WORD_JOINER}`)
    .replace(/(?<=\S)([)\]])/gu, `${WORD_JOINER}$1`)
    .replace(/[ \t]+/gu, " ")
    .trim();
}

/** Signs that the Quran face draws too large: they get the text face (see DuaCard). */
export const ARABIC_DUA_SIGN = /([.:!؟،؛()[\]–])/u;

/** The same text without the word joiners, for copying and sharing. */
export function plainDuaArabic(value) {
  return cleanDuaArabic(value).replace(/\u2060/gu, "");
}
