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
const INVISIBLE = /[\u0640\u200B-\u200F\uFEFF\uE000-\uF8FF]/u;
// The rub-el-hizb sign and the prostration sign are words of their own in QPC
// and glued to a neighbouring word in the annotated edition.
const WORD_SPACE = /[\s\u00A0\u200B\u200E\u200F\uFEFF\uE000-\uF8FF\u06DE\u06E9]/u;
// Letter shapes the editions spell with different code points. Folding them to
// one skeleton is safe because only the colour range moves, never the text, and
// every word is still required to carry the same letters and signs (sameWord).
const LETTER_CLASS = new Map([
  // yeh family (final yeh / alif maqsura / hamza seat / IndoPak dotless forms)
  ["\u064A", "\u0649"], ["\u06CC", "\u0649"], ["\u066E", "\u0649"], ["\u0626", "\u0649"],
  ["\u06D0", "\u0649"], ["\u06D2", "\u0649"], ["\u0678", "\u0649"],
  // alef family (hamza seats, wasla, madda)
  ["\u0623", "\u0627"], ["\u0625", "\u0627"], ["\u0622", "\u0627"], ["\u0671", "\u0627"],
  ["\u0673", "\u0627"], ["\u0675", "\u0627"],
  // waw family
  ["\u0624", "\u0648"], ["\u0676", "\u0648"], ["\u06C7", "\u0648"],
  // Quran.com writes the dagger alef as a wavy-hamza alef in some fields.
  ["\u0672", "\u0670"],
  // IndoPak letter shapes: keheh for kaf, heh doachashmee for heh
  ["\u06a9", "\u0643"], ["\u06aa", "\u0643"], ["\u06be", "\u0647"], ["\u06c1", "\u0647"],
]);

// Signs the two editions encode with different code points for the same sign:
// sukun, and the three tanween in their stacked (Uthmani) vs open (QPC) form.
const MARK_CLASS = new Map([
  ["\u06E1", "\u0652"],
  ["\u06DF", "\u0652"], // rounded zero on a silent letter, a sukun in the annotation
  ["\u06E0", "\u0652"], // rectangular zero, the same silent-letter sign
  ["\u0657", "\u064B"],
  ["\u065E", "\u064C"],
  ["\u0656", "\u064D"],
]);

const canon = (char) => LETTER_CLASS.get(char) ?? MARK_CLASS.get(char) ?? char;
const isMark = (char) => MARK.test(char);
const isInvisible = (char) => INVISIBLE.test(char);
// Letters that one edition may write and the other omit or move: alef, the
// dagger alef, and a free-standing hamza.
const isFloatingLetter = (char) => {
  const folded = canon(char);
  return folded === "\u0627" || folded === "\u0670" || folded === "\u0621";
};
// Pause signs differ between the editions (qalay vs jeem...) and carry no letter.
const isPauseSign = (char) => /[\u06D6-\u06DC]/u.test(char);
// QPC writes the fatha under a dagger alef or as a maddah where Uthmani omits
// or spells it differently, and some editions seat the hamza as a sign; either
// side may carry one the other lacks.
const isOptionalMark = (char) => isPauseSign(char) || char === "\u064E" || char === "\u0653" || char === "\u0654" || char === "\u0655";

const SUBSTITUTE_MARK = 0.4;
const GAP_INVISIBLE = 0.1;
const GAP_OPTIONAL = 0.3;
const GAP_MARK = 1;
const GAP_FLOATING = 2;
const LENIENT_SUBSTITUTE = 0.6;
const LENIENT_GAP = 0.5;
const FORBIDDEN = Infinity;

function substitutionCost(a, b, lenient) {
  if (a === b) return 0;
  if (canon(a) === canon(b)) return 0.2;
  // IndoPak spells its signs by another convention altogether: any sign may
  // stand for any sign, the letters still have to match.
  if (lenient && isMark(a) && isMark(b)) return LENIENT_SUBSTITUTE;
  if (isMark(a) && isMark(b)) return canon(a) === canon(b) ? 0 : FORBIDDEN;
  // QPC spells a final alif maqsura + dagger alef where Uthmani has tatweel + dagger alef.
  if ((a === "\u0640" && canon(b) === "\u0649") || (b === "\u0640" && canon(a) === "\u0649")) return SUBSTITUTE_MARK;
  if (isMark(a) || isMark(b) || isInvisible(a) || isInvisible(b)) return FORBIDDEN;
  return canon(a) === canon(b) ? 0.2 : FORBIDDEN;
}

function gapCost(char, lenient) {
  if (isInvisible(char)) return GAP_INVISIBLE;
  if (lenient && isMark(char)) return LENIENT_GAP;
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
function sameWord(a, b, lenient) {
  const split = (word) => {
    const letters = [];
    const marks = [];
    let daggerAlef = false;
    for (const char of word) {
      if (canon(char) === "ٰ") daggerAlef = true;
      if (isInvisible(char) || isFloatingLetter(char) || isOptionalMark(char)) continue;
      if (isMark(char)) {
        if (!lenient) marks.push(canon(char));
      } else letters.push(canon(char));
    }
    return { letters, marks: marks.sort().join(""), daggerAlef };
  };
  const left = split(a);
  const right = split(b);
  if (left.marks !== right.marks) return false;
  if (left.letters.join("") === right.letters.join("")) return true;
  // The dagger alef sits on an alif maqsura / yeh in QPC and IndoPak, on a
  // tatweel (or after the next letter) in Uthmani: with a dagger alef in play,
  // the yeh that carries it is spelling, not a letter. Compared without any yeh
  // on both sides, the remaining letters must still be identical.
  if (left.daggerAlef || right.daggerAlef) {
    const bare = (letters) => letters.filter((letter) => letter !== "ى").join("");
    return bare(left.letters) === bare(right.letters);
  }
  return false;
}

/** Index map from the annotated word's characters to the painted word's, or null. */
// Before an iqlab / ikhfa small meem the annotation writes the short vowel and
// the display writes the tanween (damma + meem vs dammatan + meem): one
// sound, two spellings. Folded on both sides, character for character.
const FOLD_TANWEEN = { "ً": "َ", "ٌ": "ُ", "ٍ": "ِ" };
const foldTanween = (word) => (/[ۭۢ]/u.test(word) ? [...word].map((char) => FOLD_TANWEEN[char] ?? char).join("") : word);

function alignWord(annotatedWord, paintedWord, lenient) {
  const annotated = foldTanween(annotatedWord);
  const painted = foldTanween(paintedWord);
  if (!sameWord(annotated, painted, lenient)) return null;
  const a = [...annotated];
  const b = [...painted];
  const rows = a.length + 1;
  const cols = b.length + 1;
  const cost = Array.from({ length: rows }, () => new Float64Array(cols));
  for (let i = 1; i < rows; i += 1) cost[i][0] = cost[i - 1][0] + gapCost(a[i - 1], lenient);
  for (let j = 1; j < cols; j += 1) cost[0][j] = cost[0][j - 1] + gapCost(b[j - 1], lenient);
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      cost[i][j] = Math.min(
        cost[i - 1][j - 1] + substitutionCost(a[i - 1], b[j - 1], lenient),
        cost[i - 1][j] + gapCost(a[i - 1], lenient),
        cost[i][j - 1] + gapCost(b[j - 1], lenient),
      );
    }
  }
  if (!Number.isFinite(cost[a.length][b.length])) return null;

  const map = new Array(a.length).fill(-1);
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    const here = cost[i][j];
    if (here === cost[i - 1][j - 1] + substitutionCost(a[i - 1], b[j - 1], lenient)) {
      map[i - 1] = j - 1;
      i -= 1;
      j -= 1;
    } else if (here === cost[i - 1][j] + gapCost(a[i - 1], lenient)) {
      i -= 1;
    } else {
      j -= 1;
    }
  }
  return { map, painted: b };
}

function splitWords(chars, lenient) {
  const words = [];
  let current = [];
  const flush = () => {
    if (!current.length) return;
    // A token with no letter (a free-standing pause sign) belongs to the word
    // before it: the editions disagree on whether it is glued or separate.
    const signOnly = current.every((entry) => isMark(entry.char) || isInvisible(entry.char) || isPauseSign(entry.char));
    if (signOnly && words.length) words.at(-1).push(...current);
    else words.push(current);
    current = [];
  };
  for (const entry of chars) {
    if (WORD_SPACE.test(entry.char)) flush();
    else current.push(entry);
  }
  flush();
  if (!lenient) return words;
  // IndoPak prints a one-letter prefix (wa-, fa-, bi-) as a word of its own
  // where the annotation glues it: fold such a token into the word after it,
  // on both sides, so the counts and the letters line up.
  const letters = (word) => word.filter((entry) => !isMark(entry.char) && !isInvisible(entry.char)).length;
  const merged = [];
  let carry = [];
  for (const word of words) {
    const joined = [...carry, ...word];
    carry = [];
    if (letters(joined) <= 1 && word !== words.at(-1)) carry = joined;
    else merged.push(joined);
  }
  if (carry.length) merged.push(carry);
  return merged;
}

/**
 * @param {Array<{text: string, ruleId: string|null}>} segments annotated text
 * @param {string} paintedText the text the reader renders
 * @param {(annotated: string, painted: string) => void} [onUnalignable] diagnostics hook
 * @param {{lenient?: boolean}} [options] lenient: match words by their letters only
 *   (IndoPak signs follow another convention); a sign-only span then lands on the
 *   nearest sign of the word, a letter span still lands on its exact letter
 * @returns {{segments: Array<{text: string, ruleId: string|null}>, failedWords: number}|null}
 *   segments whose concatenation is exactly `paintedText`, or null when the
 *   word counts differ. A word that cannot be aligned safely comes back
 *   uncoloured and is counted in `failedWords`.
 */
export function alignSegmentsToText(segments, paintedText, onUnalignable, { lenient = false } = {}) {
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

  const annotatedWords = splitWords(annotatedChars, lenient);
  const paintedWords = splitWords(paintedChars, lenient);
  if (annotatedWords.length !== paintedWords.length) return null;

  const paintedRule = new Array(painted.length).fill(null);
  let failedWords = 0;
  annotatedWords.forEach((word, index) => {
    const target = paintedWords[index];
    const alignment = alignWord(word.map((entry) => entry.char).join(""), target.map((entry) => entry.char).join(""), lenient);
    if (!alignment) {
      // A word without any rule loses nothing by staying unaligned.
      if (word.some((entry) => entry.rule)) {
        failedWords += 1;
        onUnalignable?.(word.map((entry) => entry.char).join(""), target.map((entry) => entry.char).join(""));
      }
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
