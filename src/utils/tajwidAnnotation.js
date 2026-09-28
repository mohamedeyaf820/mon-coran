/**
 * Quran.com Tajweed annotation parser.
 *
 * The v4 API ships `text_uthmani_tajweed`: the canonical Uthmani text with
 * inline `<rule class="...">…</rule>` spans wrapped around the characters each
 * recitation rule applies to, e.g.
 *
 *   إِ<rule class=ikhafa>ن</rule>
 *   بِ<rule class=ham_wasl>ٱ</rule>لۡمَلَ<rule class=madda_obligatory_mottasel>ـٰٓ</rule>ئِكَةِ
 *
 * This module turns that markup into `{ text, ruleId }` segments. It is
 * deliberately DOM-free so the same parser runs in the browser, in a worker and
 * in Node tests — DOMParser previously hid the Quran text integrity path behind
 * an untestable browser-only function.
 *
 * Two rules govern this file and must not be relaxed:
 *
 *  1. **The Quran text is annotated, never rewritten.** Concatenating the
 *     segments must reproduce the markup-stripped source exactly. The parser
 *     only decides which rule owns which characters; it never adds, drops,
 *     reorders or substitutes a letter, harakah or Quranic sign.
 *  2. **A rule is only ever applied when the data says so.** Class names are
 *     resolved through a fixed table; an unknown class yields an uncoloured
 *     segment rather than a guess. Inventing a recitation rule from letters is
 *     what this module exists to stop.
 */

const RULE_SPAN = /<rule\s+class\s*=\s*"?([a-z0-9_ -]+)"?\s*>([\s\S]*?)<\/rule>/gi;
const ANY_TAG = /<\/?[a-z][^>]*>/gi;

/**
 * Warsh has no verified annotated source.
 *
 * The project holds Warsh *text* (warshService + constants/warshSource.js) but
 * no per-character recitation annotation: the provider used here annotates Hafs
 * only, and the Warsh rules that predate this module were hand-written regexes
 * with no cited source. Painting Warsh from letters would be inventing a
 * recitation rule, so Warsh renders uncoloured until a real source is adopted.
 *
 * Until then this marker documents the gap in code, not just in a report.
 */
export const WARSH_TAJWID_SOURCE_REQUIRED = true;

/** Riwayas for which a verified annotated source exists. */
export const ANNOTATED_RIWAYAS = ["hafs"];

/**
 * Class name → project rule id.
 *
 * The table is intentionally complete rather than clever: every class the
 * provider can emit gets an entry, so a new upstream class surfaces as
 * `null` (no colour, no invented rule) instead of silently landing in the
 * wrong bucket.
 */
export const QURAN_COM_CLASS_MAP = {
  ham_wasl: "ham-wasl",
  ikhafa: "ikhfa",
  // The provider spells this class `ikhfa_shafawi`; the longer spelling is kept
  // as an alias so a spelling drift cannot silently uncolour the rule.
  ikhfa_shafawi: "ikhfa",
  ikhafa_shafawi: "ikhfa",
  iqlab: "iqlab",
  qalqalah: "qalqala",
  qalaqah: "qalqala",
  ghunnah: "ghunna",
  ghunna: "ghunna",
  idgham: "idgham",
  idgham_ghunnah: "idgham",
  idgham_wo_ghunnah: "idgham",
  idgham_without_ghunnah: "idgham",
  idgham_shafawi: "idgham",
  idgham_mutamathilayn: "idgham",
  idgham_mutajanisayn: "idgham",
  idgham_mutaqaribayn: "idgham",
  laam_shamsiyah: "lam-shamsiyya",
  slnt: "slnt",
  silent: "silent",
  madda_normal: "madd-normal",
  madda_permissible: "madd-separated",
  madda_obligatory: "madd-connected",
  madda_obligatory_mottasel: "madd-connected",
  madda_obligatory_monfasel: "madd-separated",
  madda_necessary: "madd",
  madd_lazim: "madd",
  madd_muttasil: "madd-connected",
  madd_munfasil: "madd-separated",
};

/** Resolve one upstream class attribute to a project rule id, or null. */
export function ruleFromClassName(className) {
  const classes = String(className || "").split(/\s+/).filter(Boolean);
  for (const item of classes) {
    const normalized = item
      .replace(/^tajweed[-_]?/i, "")
      .replace(/-/g, "_")
      .toLowerCase();
    if (QURAN_COM_CLASS_MAP[normalized]) return QURAN_COM_CLASS_MAP[normalized];
  }
  return null;
}

/** True when the string carries annotation markup worth parsing. */
export function hasTajweedMarkup(value) {
  return typeof value === "string" && /<[a-z][\s\S]*>/i.test(value);
}

/** The source text with every annotation tag removed, characters untouched. */
export function stripTajweedMarkup(value) {
  if (typeof value !== "string" || !value) return "";
  return value.replace(ANY_TAG, "");
}

/**
 * Parse annotated text into segments.
 *
 * Returns `null` when there is no markup, so the caller can decide what to do
 * (Warsh has no annotated source at all — see WARSH_TAJWID_SOURCE_REQUIRED)
 * instead of silently receiving uncoloured text.
 *
 * @param {string} annotated
 * @returns {Array<{text: string, ruleId: string|null}>|null}
 */
export function parseTajweedAnnotation(annotated) {
  if (!hasTajweedMarkup(annotated)) return null;

  const source = String(annotated);
  const segments = [];
  let cursor = 0;

  RULE_SPAN.lastIndex = 0;
  let match = RULE_SPAN.exec(source);
  while (match) {
    // Everything before the opening tag is uncoloured by definition.
    if (match.index > cursor) {
      const plain = source.slice(cursor, match.index);
      if (plain) segments.push({ text: plain, ruleId: null });
    }
    const inner = match[2].replace(ANY_TAG, "");
    if (inner) {
      segments.push({ text: inner, ruleId: ruleFromClassName(match[1]) });
    }
    cursor = match.index + match[0].length;
    match = RULE_SPAN.exec(source);
  }

  if (cursor < source.length) {
    const plain = source.slice(cursor);
    if (plain) segments.push({ text: plain, ruleId: null });
  }

  return mergeAdjacent(segments);
}

/** Collapse neighbours that share a rule so the renderer emits fewer nodes. */
function mergeAdjacent(segments) {
  const out = [];
  for (const segment of segments) {
    if (!segment.text) continue;
    const last = out[out.length - 1];
    if (last && last.ruleId === segment.ruleId) {
      out[out.length - 1] = { text: last.text + segment.text, ruleId: last.ruleId };
    } else {
      out.push({ text: segment.text, ruleId: segment.ruleId });
    }
  }
  return out;
}
