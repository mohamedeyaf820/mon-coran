import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

import {
  hasTajweedMarkup,
  parseTajweedAnnotation,
  ruleFromClassName,
  stripTajweedMarkup,
} from "../src/utils/tajwidAnnotation.js";

const require = createRequire(import.meta.url);
/** Real Quran.com word-by-word capture committed in this repo (15:7). */
const fixture = require("../tests/fixtures/word-coherence-15-7.json");
const REAL_WORDS = fixture.words.filter((word) => word.text_uthmani_tajweed);

/* ── Parser ─────────────────────────────────────────────────────────── */

test("annotated markup becomes coloured segments around the ruled characters", () => {
  const segments = parseTajweedAnnotation("إِ<rule class=ikhafa>ن</rule>");
  assert.deepEqual(segments, [
    { text: "إِ", ruleId: null },
    { text: "ن", ruleId: "ikhfa" },
  ]);
});

test("several spans in one word keep their own rule", () => {
  const source = "بِ<rule class=ham_wasl>ٱ</rule>لۡمَلَ" +
    "<rule class=madda_obligatory_mottasel>ـٰٓ</rule>ئِكَةِ";
  const segments = parseTajweedAnnotation(source);
  assert.deepEqual(segments, [
    { text: "بِ", ruleId: null },
    { text: "ٱ", ruleId: "ham-wasl" },
    { text: "لۡمَلَ", ruleId: null },
    { text: "ـٰٓ", ruleId: "madd-connected" },
    { text: "ئِكَةِ", ruleId: null },
  ]);
});

test("text without markup returns null so the caller keeps its own source", () => {
  assert.equal(parseTajweedAnnotation("بِسْمِ"), null);
  assert.equal(parseTajweedAnnotation(""), null);
  assert.equal(hasTajweedMarkup("بِسْمِ"), false);
  assert.equal(hasTajweedMarkup("إِ<rule class=ikhafa>ن</rule>"), true);
});

test("an unknown class is left uncoloured rather than guessed", () => {
  assert.equal(ruleFromClassName("rule_not_known_upstream"), null);
  const segments = parseTajweedAnnotation("ن<rule class=tajweed_future_rule>ق</rule>");
  // Both halves stay, and neither claims a rule: an unknown class must not be
  // folded into a neighbouring one.
  assert.deepEqual(segments.map((s) => s.ruleId), [null]);
  assert.equal(segments.map((s) => s.text).join(""), "نق");
});

/* ── CRITICAL: Quran text integrity ──────────────────────────────────── */

test("QURAN_TEXT_INTEGRITY: segments reproduce the marked-up source exactly", () => {
  for (const word of REAL_WORDS) {
    const annotated = word.text_uthmani_tajweed;
    if (!hasTajweedMarkup(annotated)) continue;
    const segments = parseTajweedAnnotation(annotated);
    assert.equal(
      segments.map((segment) => segment.text).join(""),
      stripTajweedMarkup(annotated),
      `${annotated}: the parser must not alter a single character`,
    );
  }
});

test("QURAN_TEXT_INTEGRITY: stripping the markup changes no letter or mark", () => {
  for (const word of REAL_WORDS) {
    const stripped = stripTajweedMarkup(word.text_uthmani_tajweed);
    const canonical = word.text_uthmani;
    // The two editions differ only in the sukun codepoint (U+06E1 vs U+0652),
    // so length equality is what makes the spans index-alignable onto the
    // canonical text. A length drift would silently mis-colour the Quran.
    assert.equal(
      [...stripped].length,
      [...canonical].length,
      `${canonical}: annotated and canonical text must stay aligned`,
    );
  }
});

test("QURAN_TEXT_INTEGRITY: parsing is idempotent and never mutates its input", () => {
  for (const word of REAL_WORDS) {
    const annotated = word.text_uthmani_tajweed;
    const first = parseTajweedAnnotation(annotated);
    const second = parseTajweedAnnotation(annotated);
    assert.deepEqual(first, second, "a shared regex must not carry state between calls");
    assert.equal(word.text_uthmani_tajweed, annotated, "the source word is untouched");
  }
});

test("Tajwid OFF is a rendering choice, never a text choice", () => {
  // With the toggle off the app renders `text_uthmani`; with it on it renders
  // the same characters plus colour. The two editions differ only in the sukun
  // codepoint the provider prints (U+06E1 in the tajweed edition, U+0652 in the
  // canonical one) — the project's own normaliser already equates them, so no
  // letter, harakah or Quranic sign may differ.
  // U+06E1 (the tajweed edition's sukun) is the same sign as the canonical
  // U+0652; the project's own normaliser already equates the two. No letter,
  // harakah or Quranic sign may differ between the two modes.
  const toCanonicalSukun = (value) => value.replace(/\u06E1/g, "\u0652");
  for (const word of REAL_WORDS) {
    assert.equal(
      toCanonicalSukun(stripTajweedMarkup(word.text_uthmani_tajweed)),
      word.text_uthmani,
      `${word.text_uthmani}: the two modes must not disagree beyond the sukun glyph`,
    );
  }
});

/* ── Rule coverage of the observed provider taxonomy ─────────────────── */

test("every class the provider emits resolves to a rule", () => {
  // The 18 classes measured across seven surates. If the provider ever emits a
  // class outside this list, it must fail here rather than paint the wrong rule.
  const observed = [
    "ham_wasl", "ikhafa", "madda_normal", "idgham_ghunnah", "ghunnah", "slnt",
    "madda_permissible", "qalqalah", "madda_obligatory_mottasel", "laam_shamsiyah",
    "idgham_wo_ghunnah", "madda_obligatory_monfasel", "idgham_shafawi", "iqlab",
    "ikhfa_shafawi", "madda_necessary", "idgham_mutajanisayn", "idgham_mutaqaribayn",
  ];
  for (const cls of observed) {
    assert.ok(ruleFromClassName(cls), `${cls} must resolve to a rule`);
  }
});
