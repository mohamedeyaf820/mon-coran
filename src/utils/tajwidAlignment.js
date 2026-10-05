/**
 * Carry Quran.com's Tajweed spans onto the text the reader actually paints.
 *
 * Quran.com annotates its Uthmani edition (`text_uthmani_tajweed`), while the
 * Hafs reader paints the QPC edition. The two spell the same words with the
 * same letters but different sign conventions: sukun U+06E1 vs U+0652, tanween
 * stacked vs open (U+064B vs U+0657), a tatweel carrying the dagger alef, the
 * order of the dagger alef and its neighbours, a ZWNJ before a pause sign. A
 * strict string comparison therefore refused most verses, and a verse that is
 * refused is not coloured at all.
 *
 * This module aligns the two spellings word by word and moves each span onto
 * the painted characters that correspond to it. The painted text is never
 * touched: only ranges move. The mapping is deliberately conservative:
 *  - both words must have the same base letters (after the documented
 *    yeh/alif-maqsura equivalence); a word whose letters differ is left uncoloured;
 *  - only signs, tatweel, ZWNJ/ZWJ, the dagger alef and a silent alef may be
 *    absent from one side;
 *  - a span that lands on no painted character is dropped, never widened.
 */

const MARK = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/u;
const INVISIBLE = /[\u0640\u200B-\u200D]/u;
// The rub-el-hizb sign and the prostration sign are words of their own in QPC
// and glued to a neighbouring word in the annotated edition.
const WORD_SPACE = /[\s\u00A0\u200B\u06DE\u06E9]/u;
// Letters Quran.com and QPC write with different code points for one letter.
const LETTER_CLASS = new Map([
  ["\u064A", "\u0649"], // yeh to alif maqsura
  ["\u06CC", "\u0649"], // farsi yeh
  ["\u066E", "\u0649"], // dotless beh, the skeleton of a final yeh
]);

// Signs the two editions encode with different code points for the same sign:
// sukun, and the three tanween in their stacked (Uthmani) vs open (QPC) form.
const MARK_CLASS = new Map([
  ["ۡ", "ْ"],
  ["ٗ", "ً"],
  ["ٞ", "ٌ"],
  ["ٖ", "ٍ"],
]);

const canon = (char) => LETTER_CLASS.get(char) ?? MARK_CLASS.get(char) ?? char;
const isMark = (char) => MARK.test(char);
const isInvisible = (char) => INVISIBLE.test(char);
// Letters that one edition may write and the other omit or move.
const isFloatingLetter = (char) => char === "\u0627" || char === "\u0670";
// Pause signs differ between the editions (qalay vs jeem...) and carry no letter.
const isPauseSign = (char) => /[\u06d6-\u06dc]/u.test(char);
// QPC writes the fatha under a dagger alef or as a maddah where Uthmani omits
// or spells it differently; either side may carry one the other lacks.
const isOptionalMark = (char) => isPauseSign(char) || char === "\u064e" || char === "\u0653";

const SUBSTITUTE_MARK = 0.4;
const GAP_INVISIBLE = 0.1;
const GAP_OPTIONAL = 0.3;
const GAP_MARK = 1;
const GAP_FLOATING = 2;
const FORBIDDEN = Infinity;

function substitutionCost(a, b) {
  if (a === b) return 0;
  if (isMark(a) && isMark(b)) return canon(a) === canon(b) ? 0 : FORBIDDEN;
  // QPC spells a final alif maqsura + dagger alef where Uthmani has tatweel + dagger alef.
  if ((a === "\u0640" && canon(b) === "\u0649") || (b === "\u0640" && canon(a) === "\u0649")) return SUBSTITUTE_MARK;
  if (isMark(a) || isMark(b) || isInvisible(a) || isInvisible(b)) return FORBIDDEN;
  return canon(a) === canon(b) ? 0.2 : FORBIDDEN;
}

function gapCost(char) {
  if (isInvisible(char)) return GAP_INVISIBLE;
  if (isOptionalMark(char)) return GAP_OPTIONAL;
  if (isMark(char)) return GAP_MARK;
  if (isFloatingLetter(char)) return GAP_FLOATING;
  return FORBIDDEN;
}

/**
 * The same word, spelled in two editions: identical letters in the same order
 * and the same signs (order aside), once the documented encodings are merged.
 * The dagger alef, a silent alef, tatweel, ZWNJ, pause signs, the fatha and the
 * maddah may exist on one side only.
 * Without this, a different vowel could "align" as a pair of gaps.
 */
function sameWord(a, b) {
  const split = (word) => {
    const letters = [];
    const marks = [];
    const chars = [...word];
    for (const [index, char] of chars.entries()) {
      if (isInvisible(char) || isFloatingLetter(char) || isOptionalMark(char)) continue;
      // QPC carries the dagger alef on an alif maqsura where Uthmani uses a tatweel.
      if (canon(char) === "ى" && chars[index + 1] === "ٰ") continue;
      if (isMark(char)) marks.push(canon(char));
      else letters.push(canon(char));
    }
    return { letters: letters.join(""), marks: marks.sort().join("") };
  };
  const left = split(a);
  const right = split(b);
  return left.letters === right.letters && left.marks === right.marks;
}

/** Index map from the annotated word's characters to the painted word's, or null. */
function alignWord(annotated, painted) {
  if (!sameWord(annotated, painted)) return null;
  const a = [...annotated];
  const b = [...painted];
  const rows = a.length + 1;
  const cols = b.length + 1;
  const cost = Array.from({ length: rows }, () => new Float64Array(cols));
  for (let i = 1; i < rows; i += 1) cost[i][0] = cost[i - 1][0] + gapCost(a[i - 1]);
  for (let j = 1; j < cols; j += 1) cost[0][j] = cost[0][j - 1] + gapCost(b[j - 1]);
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      cost[i][j] = Math.min(
        cost[i - 1][j - 1] + substitutionCost(a[i - 1], b[j - 1]),
        cost[i - 1][j] + gapCost(a[i - 1]),
        cost[i][j - 1] + gapCost(b[j - 1]),
      );
    }
  }
  if (!Number.isFinite(cost[a.length][b.length])) return null;

  const map = new Array(a.length).fill(-1);
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    const here = cost[i][j];
    if (here === cost[i - 1][j - 1] + substitutionCost(a[i - 1], b[j - 1])) {
      map[i - 1] = j - 1;
      i -= 1;
      j -= 1;
    } else if (here === cost[i - 1][j] + gapCost(a[i - 1])) {
      i -= 1;
    } else {
      j -= 1;
    }
  }
  return { map, painted: b };
}

function splitWords(chars) {
  const words = [];
  let current = [];
  for (const entry of chars) {
    if (WORD_SPACE.test(entry.char)) {
      if (current.length) words.push(current);
      current = [];
    } else current.push(entry);
  }
  if (current.length) words.push(current);
  return words;
}

/**
 * @param {Array<{text: string, ruleId: string|null}>} segments annotated text
 * @param {string} paintedText the text the reader renders
 * @returns {{segments: Array<{text: string, ruleId: string|null}>, failedWords: number}|null}
 *   segments whose concatenation is exactly `paintedText`, or null when the
 *   word counts differ. A word that cannot be aligned safely comes back
 *   uncoloured and is counted in `failedWords`.
 */
export function alignSegmentsToText(segments, paintedText) {
  const painted = String(paintedText ?? "");
  const annotatedChars = [];
  for (const segment of segments) {
    for (const char of segment.text) annotatedChars.push({ char, rule: segment.ruleId || null });
  }
  const paintedChars = [];
  let unit = 0;
  for (const char of painted) {
    paintedChars.push({ char, unit });
    unit += char.length;
  }

  const annotatedWords = splitWords(annotatedChars);
  const paintedWords = splitWords(paintedChars);
  if (annotatedWords.length !== paintedWords.length) return null;

  const paintedRule = new Array(painted.length).fill(null);
  let failedWords = 0;
  annotatedWords.forEach((word, index) => {
    const target = paintedWords[index];
    const alignment = alignWord(word.map((entry) => entry.char).join(""), target.map((entry) => entry.char).join(""));
    if (!alignment) {
      // A word without any rule loses nothing by staying unaligned.
      if (word.some((entry) => entry.rule)) failedWords += 1;
      return;
    }
    word.forEach((entry, k) => {
      const hit = alignment.map[k];
      if (!entry.rule || hit < 0) return;
      const { char, unit: start } = target[hit];
      for (let u = 0; u < char.length; u += 1) paintedRule[start + u] = entry.rule;
    });
  });

  const aligned = [];
  for (let i = 0; i < painted.length; i += 1) {
    const ruleId = paintedRule[i];
    const previous = aligned.at(-1);
    if (previous && previous.ruleId === ruleId) previous.text += painted[i];
    else aligned.push({ text: painted[i], ruleId });
  }
  return { segments: aligned, failedWords };
}
