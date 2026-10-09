/**
 * Warsh rule ranges from the aligned user archive, with the edition's Dabt
 * as fallback when no unambiguous archive match exists.
 *
 * The output has the same shape as `getPerWordTajweedRanges`: one array of
 * `{ start, end, ruleId }` per word, addressing UTF-16 offsets inside that
 * word, so the Mushaf painter can colour a printed word without ever
 * rewriting, reordering or re-encoding a single Quranic character.
 *
 * Rules are only emitted where the edition's notation fixes them:
 * - the Wasl dabt on the article alef → ham-wasl (and the article's lam before
 *   a doubled letter → lam-shamsiyya),
 * - the small high mim the edition prints for Iqlab → iqlab, on the marked
 *   letter and on the following ب,
 * - the printed Sila letter of ه / م → madd-normal (two beats),
 * - a printed sukun on a word-final alef → silent,
 * - a printed sukun on ق ط ب ج د → qalqala,
 * - a printed shadda on ن / م → ghunna.
 *
 * Everything the notation does not fix stays plain: an unreadable sign never
 * becomes a rule, and no rule is inferred from a letter pattern alone. The
 * signs left out and the reason for each are in `warshTajwidSigns.js`.
 */

import { WARSH_SIGN } from "../data/warshTajwidSigns.js";
import { getWarshArchiveRanges } from "./warshArchiveRules.js";

// Dabt signs are attached to the letter they sit on, so a word is read as
// letter clusters. Every range below is expressed in the original string.
const SIGN_RANGES = Object.freeze([
  Object.freeze([0x0610, 0x061a]),
  Object.freeze([0x064b, 0x065f]),
  Object.freeze([0x0670, 0x0670]),
  Object.freeze([0x06d6, 0x06ed]),
]);

const ALEF = 0x0627;
const LAM = 0x0644;
const WAW = 0x0648;
const BEH = 0x0628;
const MEEM = 0x0645;
const NOON = 0x0646;

const HAMZA_FORMS = new Set([0x0621, 0x0623, 0x0625, 0x0626]);
const QALQALA_LETTERS = new Set([0x0642, 0x0637, 0x0628, 0x062c, 0x062f]);

// The reader's own canonicalisation (`normalizeQuranGlyphText`) writes the
// ishmam / tashil sign as U+06EB and only the font boundary turns it into the
// glyph a face has (U+06EC for QCF, U+06DF for the Warsh face). The derivation
// runs on the canonical text for the mushaf sheet, and on the font-variant text
// for the verse-by-verse reading, so all three spellings are the same sign.
const WASL_DABT_SIGNS = new Set([0x06eb, 0x06ec, 0x06df]);

function isSign(codePoint) {
  return SIGN_RANGES.some(([from, to]) => codePoint >= from && codePoint <= to);
}

/** Read one printed word as its letter clusters, keeping original offsets. */
export function readWarshClusters(word) {
  const text = String(word ?? "");
  const clusters = [];
  let current = null;
  for (let index = 0; index < text.length;) {
    const codePoint = text.codePointAt(index);
    const width = codePoint > 0xffff ? 2 : 1;
    if (isSign(codePoint)) {
      if (current) {
        current.signs.push(codePoint);
        current.signStarts.push(index);
        current.end = index + width;
      }
    } else {
      current = { letter: codePoint, start: index, end: index + width, signs: [], signStarts: [] };
      clusters.push(current);
    }
    index += width;
  }
  return clusters;
}

function hasSign(cluster, sign) {
  return Boolean(cluster?.signs.includes(sign));
}

/** One sign, several code points: the canonical form and the QPC form of it. */
function hasAnySign(cluster, signs) {
  return Boolean(cluster?.signs.some((sign) => signs.has(sign)));
}

function signStart(cluster, sign) {
  const at = cluster.signs.indexOf(sign);
  return at < 0 ? -1 : cluster.signStarts[at];
}

/**
 * The next printed letter after one cluster, looking into the following word:
 * Iqlab and the Sila length both depend on the letter that comes next in the
 * continuous reading, not on the word boundary.
 */
function nextLetterPosition(clustersPerWord, wordIndex, clusterIndex) {
  if (clusterIndex + 1 < clustersPerWord[wordIndex].length) {
    return { wordIndex, clusterIndex: clusterIndex + 1 };
  }
  for (let next = wordIndex + 1; next < clustersPerWord.length; next += 1) {
    if (clustersPerWord[next].length) return { wordIndex: next, clusterIndex: 0 };
  }
  return null;
}

/**
 * Rule ranges for the words of one ayah, in the words' own offsets.
 * Returns `[]` for empty input; a word with nothing to paint gets `[]`.
 */
export function getWarshPerWordTajweedRanges(words) {
  if (!Array.isArray(words) || words.length === 0) return [];
  const archive = getWarshArchiveRanges(words);
  if (archive) return archive;
  const clustersPerWord = words.map(readWarshClusters);
  const ranges = words.map(() => []);
  const paint = (wordIndex, start, end, ruleId) => {
    if (end > start) ranges[wordIndex].push({ start, end, ruleId });
  };

  clustersPerWord.forEach((clusters, wordIndex) => {
    clusters.forEach((cluster, clusterIndex) => {
      const next = nextLetterPosition(clustersPerWord, wordIndex, clusterIndex);
      const nextCluster = next ? clustersPerWord[next.wordIndex][next.clusterIndex] : null;

      // Iqlab: the edition prints its own mim over the Nun or the Tanwin that
      // the following ب turns into a mim. The official Hafs annotation paints
      // both the marked letter and that ب, so the same two ranges are emitted.
      // A mark on the last letter of an ayah keeps its own paint; the ب it
      // turns into belongs to the ayah that follows.
      if (hasSign(cluster, WARSH_SIGN.SMALL_HIGH_MEEM)) {
        const turnsIntoBeh = nextCluster === null || nextCluster.letter === BEH;
        if (turnsIntoBeh) paint(wordIndex, cluster.start, cluster.end, "iqlab");
        if (nextCluster?.letter === BEH) {
          paint(next.wordIndex, nextCluster.start, nextCluster.end, "iqlab");
        }
        return;
      }

      // The printed Sila letter: a two-beat madd. Where the edition lengthens
      // it (maddah) or the next letter is a hamza, the reading is the longer
      // Sila kubra, and this step claims nothing.
      const sila = hasSign(cluster, WARSH_SIGN.SMALL_WAW)
        ? WARSH_SIGN.SMALL_WAW
        : hasSign(cluster, WARSH_SIGN.SMALL_YEH) ? WARSH_SIGN.SMALL_YEH : null;
      if (sila !== null) {
        const at = signStart(cluster, sila);
        const lengthened = hasSign(cluster, WARSH_SIGN.MADDAH)
          || Boolean(nextCluster && HAMZA_FORMS.has(nextCluster.letter));
        if (!lengthened && at >= 0) paint(wordIndex, at, at + 1, "madd-normal");
        return;
      }

      // The article: the edition marks its hamza — here the Wasl one — with this
      // dabt. The mark sits on the word's first alef, optionally after the waw
      // of وَٱلْ, and the lam that follows is what identifies the article. The
      // same dabt also carries Hamzat qat' (اَ۬وْ, اَ۬ن) and the hamza of ؤ / ئ
      // (يُّوَ۬اخِذُكُمُ), and U+06DF opens Wasl verbs on its own (اُ۫عْبُدُواْ), so
      // two more shapes are refused: a doubled lam (اَ۬لَّا = أَلَّا) and an alef
      // that does not open the word.
      if (cluster.letter === ALEF && hasAnySign(cluster, WASL_DABT_SIGNS)
        && (clusterIndex === 0 || (clusterIndex === 1 && clusters[0].letter === WAW))
        && clusters[clusterIndex + 1]?.letter === LAM
        && !hasSign(clusters[clusterIndex + 1], WARSH_SIGN.SHADDA)) {
        const lam = clusters[clusterIndex + 1];
        paint(wordIndex, cluster.start, cluster.end, "ham-wasl");
        if (hasSign(clusters[clusterIndex + 2], WARSH_SIGN.SHADDA)) {
          paint(wordIndex, lam.start, lam.end, "lam-shamsiyya");
        }
        return;
      }

      // A printed sukun on an alef: written, not read. Both the final alef of
      // كَفَرُواْ and the medial alef of مِاْئَةَ carry it in this edition.
      if (cluster.letter === ALEF && hasSign(cluster, WARSH_SIGN.SUKUN)) {
        paint(wordIndex, cluster.start, cluster.end, "silent");
        return;
      }

      // A printed sukun on a qalqala letter.
      if (QALQALA_LETTERS.has(cluster.letter) && hasSign(cluster, WARSH_SIGN.SUKUN)) {
        paint(wordIndex, cluster.start, cluster.end, "qalqala");
        return;
      }

      // A printed shadda on a nun or a mim.
      if ((cluster.letter === NOON || cluster.letter === MEEM) && hasSign(cluster, WARSH_SIGN.SHADDA)) {
        paint(wordIndex, cluster.start, cluster.end, "ghunna");
      }
    });
  });

  return ranges.map((list) => list.sort((a, b) => a.start - b.start));
}

