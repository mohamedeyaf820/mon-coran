/** Warsh annotation boundary: the pinned user archive annotates aligned verses;
 * the edition’s printed Dabt remains the fallback. Neither source rewrites
 * printed text or consumes Hafs annotations. The archive is not scholar-reviewed.
 */

import { stripEmbeddedAyahMarkers } from "../data/fonts.js";
import { WARSH_TAJWID_SOURCE } from "../data/warshTajwidSigns.js";
import { getWarshPerWordTajweedRanges } from "../utils/warshTajwidRanges.js";
import { splitTajwidIntoWords } from "../utils/tajwidWords.js";
import { warshArchiveMeta } from "../utils/warshArchiveRules.js";

const WARSH_SOURCE_STATUS = Object.freeze({
  riwaya: "warsh",
  status: "warsh-dabt",
  validationStatus: "DABT_OF_PINNED_EDITION",
  annotationAvailable: true,
  sourceId: WARSH_TAJWID_SOURCE.id,
  sourceCommit: WARSH_TAJWID_SOURCE.commit,
  sourceSha256: WARSH_TAJWID_SOURCE.sha256,
  coverage: Object.freeze({
    words: 77425,
    paintedWords: 25562,
    ayahs: 6214,
    paintedAyahs: 5725,
    ruleIds: Object.freeze(["ham-wasl", "lam-shamsiyya", "silent", "iqlab", "ghunna", "qalqala", "madd-normal"]),
  }),
  // Still true, and still enforced: these rule families need a validated
  // source of their own before any of them may reach a reader.
  pendingRuleFamilies: WARSH_TAJWID_SOURCE.unpaintedRuleFamilies,
  candidateSourceId: "qud-quranic-phonemizer",
  candidateSourceUrl: "https://github.com/QUD-Technologies/quranic-phonemizer",
});

/** Source availability for reader copy and diagnostics; no inferred rules. */
export function getWarshTajwidSourceStatus() {
  if (warshArchiveMeta) return Object.freeze({
    riwaya: "warsh", status: "warsh-user-archive", validationStatus: "USER_PROVIDED_TEXT_ALIGNED",
    annotationAvailable: true, validatedByScholar: false,
    sourceId: warshArchiveMeta.source, sourceSha256: warshArchiveMeta.sourceJsonSha256,
    coverage: Object.freeze({ ayahs: 6214, alignedAyahs: warshArchiveMeta.alignedAyahs,
      skippedAyahs: warshArchiveMeta.skippedAyahs, paintedWords: warshArchiveMeta.paintedWords,
      ruleIds: Object.freeze([...warshArchiveMeta.ruleIds]) }),
    pendingRuleFamilies: Object.freeze(["imala", "taqlil", "naql", "ibdal", "lam-taghlith"]),
  });
  return WARSH_SOURCE_STATUS;
}

/**
 * The plain words already used by the Warsh reader. Marker/font preparation
 * belongs to the existing text pipeline and does not change with the toggle.
 */
export function warshDisplayWords(ayah) {
  const source =
    Array.isArray(ayah?.warshWords) && ayah.warshWords.length > 0
      ? ayah.warshWords
          .map((word) => (typeof word === "string" ? word : word?.text || ""))
          .join(" ")
      : ayah?.text || "";
  return stripEmbeddedAyahMarkers(String(source).normalize("NFC"), {
    ayahNumber: ayah?.numberInSurah,
  })
    .split(/\s+/u)
    .filter(Boolean);
}

/**
 * The same shape `getHafsTajwidSource` returns, so `buildFlowSegments` can
 * read a Warsh page exactly the way it reads a Hafs one: `words` carries the
 * printed text, its separators and the rule ranges of that same text.
 *
 * `wordAudioIsAligned` stays false: the ranges come from the Warsh text, never
 * from Hafs word-audio coordinates, so the sheet must not offer a word-recital
 * position for them.
 */
export function getWarshTajwidSource(ayah) {
  const words = warshDisplayWords(ayah);
  const ranges = getWarshPerWordTajweedRanges(words);
  return {
    riwaya: "warsh",
    original: words.join(" "),
    annotation: null,
    text: words.join(" "),
    status: "annotated",
    diagnostic: null,
    words: words.map((text, index) => ({
      text,
      ranges: ranges[index] || [],
      separator: " ",
    })),
    wordAudioIsAligned: false,
  };
}

/**
 * The same source, built for a whole printed verse.
 *
 * The mushaf sheet reads `words[].ranges` through `buildFlowSegments`, while
 * the verse-by-verse reading (surah mode and the "Liste" layout of page mode)
 * goes through `TajweedText`, which paints `{ text, ruleId }` segments over the
 * whole verse. This returns that shape, derived from the very same ranges, so
 * both surfaces of one riwaya can never disagree.
 *
 * The input is the printed verse text. `applyFontSigns` draws the canonical
 * ishmam sign as U+06DF on the Warsh face, which the derivation accepts for the
 * same sign at the same offsets.
 *
 * Fail-closed: if the segments ever stop reproducing the printed text, the
 * verse is returned plain rather than painted.
 */
export function getWarshTajwidAnnotatedSource(printedText) {
  const text = String(printedText ?? "");
  if (!text.trim()) return null;
  const pieces = text.split(/(\s+)/u);
  const words = pieces.filter((part) => part && !/^\s+$/u.test(part));
  const rangesPerWord = getWarshPerWordTajweedRanges(words);
  const segments = [];
  let wordIndex = 0;
  const push = (pieceText, ruleId) => {
    if (!pieceText) return;
    const previous = segments.at(-1);
    if (previous?.ruleId === ruleId) previous.text += pieceText;
    else segments.push({ text: pieceText, ruleId });
  };
  for (const part of pieces) {
    if (!part) continue;
    if (/^\s+$/u.test(part)) {
      push(part, null);
      continue;
    }
    let cursor = 0;
    for (const range of rangesPerWord[wordIndex] || []) {
      push(part.slice(cursor, range.start), null);
      push(part.slice(range.start, range.end), range.ruleId);
      cursor = range.end;
    }
    push(part.slice(cursor), null);
    wordIndex += 1;
  }
  // The verse is only ever painted when the segments still spell it exactly.
  if (segments.map((segment) => segment.text).join("") !== text) {
    return { text, original: text, segments: [{ text, ruleId: null }], status: "plain", diagnostic: null, words: [], wordAudioIsAligned: false, annotation: null };
  }
  return {
    text,
    original: text,
    segments,
    status: segments.some((segment) => segment.ruleId) ? "annotated" : "plain",
    diagnostic: null,
    words: splitTajwidIntoWords(segments).words,
    wordAudioIsAligned: false,
    annotation: null,
  };
}

/**
 * Per-ayah rule ranges keyed by `surah:ayah`. No network request, no cache
 * read, and nothing derived from a Hafs offset or a caller-supplied rule: the
 * only input is the pinned text carried by `displayWords`.
 */
export async function getWarshTajweedAnnotations(entries = []) {
  const annotations = new Map();
  for (const entry of entries) {
    const displayWords = Array.isArray(entry?.displayWords) ? entry.displayWords : [];
    if (displayWords.length === 0) continue;
    const ranges = getWarshPerWordTajweedRanges(displayWords.map(String));
    if (!ranges.some((wordRanges) => wordRanges.length)) continue;
    annotations.set(`${entry.surah}:${entry.ayah}`, ranges);
  }
  return annotations;
}
