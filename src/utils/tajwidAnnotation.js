/** Quran.com transport annotations. This module never rewrites Quran text. */
import { alignSegmentsToText } from "./tajwidAlignment.js";
// Transport markup only ever paints a Hafs verse. Warsh rules come from the
// Dabt of the pinned Warsh edition (src/data/warshTajwidSigns.js), so an
// annotation that claims a Warsh riwaya is refused here as well.
export const ANNOTATED_RIWAYAS = Object.freeze(["hafs"]);

// A rule retains its meaning even when two rules share the same ink.
export const QURAN_COM_CLASS_MAP = Object.freeze({
  ham_wasl: "ham-wasl", slnt: "silent", silent: "silent",
  ghunnah: "ghunna", ghunna: "ghunna", ikhafa: "ikhfa", ikhfa: "ikhfa",
  ikhafa_shafawi: "ikhfa-shafawi", ikhfa_shafawi: "ikhfa-shafawi",
  iqlab: "iqlab", qalaqah: "qalqala", qalqalah: "qalqala",
  laam_shamsiyah: "lam-shamsiyya",
  idgham: "idgham", idgham_ghunnah: "idgham-ghunnah",
  idgham_wo_ghunnah: "idgham-without-ghunnah",
  idgham_without_ghunnah: "idgham-without-ghunnah",
  idgham_shafawi: "idgham-shafawi",
  idgham_mutajanisayn: "idgham-mutajanisayn",
  idgham_mutaqaribayn: "idgham-mutaqaribayn",
  madda_normal: "madd-normal", madda_permissible: "madd-permissible",
  madda_obligatory: "madd-obligatory", madda_obligatory_mottasel: "madd-connected",
  madda_obligatory_monfasel: "madd-obligatory-separated",
  madda_necessary: "madd", madd_lazim: "madd",
  madd_muttasil: "madd-connected", madd_munfasil: "madd-separated",
});

export function ruleFromClassName(className) {
  for (const value of String(className || "").split(/\s+/)) {
    const key = value.replace(/^tajweed[-_]?/i, "").replace(/-/g, "_").toLowerCase();
    if (Object.hasOwn(QURAN_COM_CLASS_MAP, key)) return QURAN_COM_CLASS_MAP[key];
  }
  return null;
}

export function hasTajweedMarkup(value) {
  return typeof value === "string" && /<\/?[a-z]/i.test(value);
}

function decodeTransportEntities(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (whole, entity) => {
    const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" };
    if (entity[0] !== "#") return named[entity.toLowerCase()] ?? whole;
    const point = entity[1].toLowerCase() === "x"
      ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10);
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
      ? String.fromCodePoint(point) : whole;
  });
}

/** Remove transport tags only; never normalize Arabic, whitespace or signs. */
export function stripTajweedMarkup(value) {
  return decodeTransportEntities(String(value ?? "").replace(/<[^>]*(?:>|$)/g, ""));
}

function appendSegment(segments, text, ruleId) {
  if (!text) return;
  const previous = segments.at(-1);
  if (previous?.ruleId === ruleId) previous.text += text;
  else segments.push({ text, ruleId });
}

function readAnnotation(value) {
  const source = String(value ?? "");
  const segments = [];
  const stack = [];
  let cursor = 0;
  let valid = true;
  const tokenPattern = /<[^>]*(?:>|$)|[^<]+/g;
  for (const token of source.matchAll(tokenPattern)) {
    if (token.index !== cursor) valid = false;
    cursor = token.index + token[0].length;
    const part = token[0];
    if (!part.startsWith("<")) {
      appendSegment(segments, decodeTransportEntities(part), stack.at(-1)?.ruleId ?? null);
      continue;
    }
    const closing = /^<\/(rule|tajweed|span)\s*>$/i.exec(part);
    if (closing) {
      if (stack.at(-1)?.tag !== closing[1].toLowerCase()) valid = false;
      else stack.pop();
      continue;
    }
    // Other tags/attributes cannot execute, strip content or alter offsets.
    const opening = /^<(rule|tajweed|span)\s+class\s*=\s*(?:"([\w\s-]*)"|'([\w\s-]*)'|([\w-]+))\s*>$/i.exec(part);
    if (!opening) { valid = false; continue; }
    const className = opening[2] ?? opening[3] ?? opening[4];
    stack.push({ tag: opening[1].toLowerCase(), ruleId: ruleFromClassName(className) });
  }
  if (cursor !== source.length || stack.length) valid = false;
  const plain = stripTajweedMarkup(source);
  if (segments.map((segment) => segment.text).join("") !== plain) valid = false;
  return { plain, valid, segments: valid ? segments : [{ text: plain, ruleId: null }] };
}

/** Pure parser shared by words, verses, Node and every UI surface. */
export function parseTajweedAnnotation(annotated) {
  return hasTajweedMarkup(annotated) ? readAnnotation(annotated).segments : null;
}

/** Strict equality only. Edition differences go through alignSegmentsToText, which moves spans and never text. */
export function isAnnotationAlignedForPaint(annotatedPlain, displayText) {
  return String(annotatedPlain ?? "") === String(displayText ?? "");
}

/** A mismatch leaves the immutable source plain and emits an integrity diagnostic. */
export function normalizeTajwidAnnotation(originalText, annotatedText, { riwaya = "hafs", source = "quran.com", lenient = false } = {}) {
  const text = String(originalText ?? "");
  const result = { text, segments: [{ text, ruleId: null }], status: "plain", diagnostic: null };
  if (!ANNOTATED_RIWAYAS.includes(riwaya) || source !== "quran.com") {
    return { ...result, status: "unavailable" };
  }
  if (annotatedText == null || annotatedText === "") return result;
  const annotation = readAnnotation(annotatedText);
  const status = hasTajweedMarkup(annotatedText) ? "annotated" : "plain";
  if (annotation.valid && annotation.plain === text) {
    return { ...result, segments: annotation.segments, status };
  }
  // Quran.com annotates its Uthmani edition; the reader paints another edition
  // of the same words. Move the spans onto the painted characters instead of
  // refusing the whole verse (see tajwidAlignment.js). The painted text itself
  // is never rewritten: the aligned segments concatenate to exactly `text`.
  const aligned = annotation.valid ? alignSegmentsToText(annotation.segments, text, undefined, { lenient }) : null;
  if (aligned) {
    // A word whose letters or signs cannot be matched stays plain and is
    // reported; the other words of the verse keep their colours.
    return {
      ...result, segments: aligned.segments, status, alignment: "mapped",
      diagnostic: aligned.failedWords
        ? { code: "QURAN_TEXT_INTEGRITY_FAILURE", reason: "word-not-alignable", words: aligned.failedWords }
        : null,
    };
  }
  return { ...result, status: "invalid", diagnostic: {
    code: "QURAN_TEXT_INTEGRITY_FAILURE",
    reason: annotation.valid ? "annotation-text-mismatch" : "malformed-annotation",
  } };
}

/** Strict audit/build assertion; runtime callers retain the original text. */
export function assertTajwidIntegrity(result) {
  if (result.diagnostic || result.segments.map(segment => segment.text).join("") !== result.text) {
    throw new Error("QURAN_TEXT_INTEGRITY_FAILURE");
  }
  return result;
}

/** Append generated presentation furniture without reparsing or altering source rules. */
export function withTajwidPresentationSuffix(source, displayText) {
  const text = String(displayText ?? "");
  if (!text.startsWith(source.text)) {
    return { text, segments: [{ text, ruleId: null }], status: "invalid", diagnostic: {
      code: "QURAN_TEXT_INTEGRITY_FAILURE", reason: "annotation-text-mismatch",
    } };
  }
  const suffix = text.slice(source.text.length);
  return { ...source, text, segments: suffix ? [...source.segments, { text: suffix, ruleId: null }] : source.segments };
}

/** A shaping-safe whole-word fallback is honest only for complete coverage. */
export function getWholeWordTajwidRule(text, ranges = []) {
  if (!text || !ranges.length) return null;
  const ordered = [...ranges].sort((a, b) => a.start - b.start);
  const ruleId = ordered[0].ruleId;
  let cursor = 0;
  for (const range of ordered) {
    if (range.ruleId !== ruleId || range.start !== cursor || range.end <= cursor || range.end > text.length) return null;
    cursor = range.end;
  }
  return cursor === text.length ? ruleId : null;
}
