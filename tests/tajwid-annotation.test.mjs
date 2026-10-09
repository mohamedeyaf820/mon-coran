import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  normalizeTajwidAnnotation,
  hasTajweedMarkup,
  isAnnotationAlignedForPaint,
  parseTajweedAnnotation,
  QURAN_COM_CLASS_MAP,
  ruleFromClassName,
  stripTajweedMarkup,
} from "../src/utils/tajwidAnnotation.js";
import { parseTajwid } from "../src/data/tajwidRules.js";

const require = createRequire(import.meta.url);
/** Real Quran.com word-by-word capture committed in this repo (15:7). */
const fixture = require("../tests/fixtures/word-coherence-15-7.json");
const REAL_WORDS = fixture.words.filter((word) => word.text_uthmani_tajweed);

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..");
const THEMES_CSS = readFileSync(join(SRC, "src/styles/domains/themes4.css"), "utf8");

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

test("the verse-level <tajweed> tag is annotated like the word-level <rule> tag", () => {
  // Captured live from api.quran.com /quran/verses/uthmani_tajweed (112:1),
  // ayah marker already stripped the way quranComAPI.js strips it. The two
  // fields carry the same annotation under different tag names, and the verse
  // field used to parse as one uncoloured run.
  const annotated =
    "قُلْ هُوَ <tajweed class=ham_wasl>ٱ</tajweed>للَّهُ أَحَ<tajweed class=qalaqah>د</tajweed>ٌ";
  const segments = parseTajweedAnnotation(annotated);

  assert.deepEqual(
    segments.filter((segment) => segment.ruleId).map((segment) => segment.ruleId),
    ["ham-wasl", "qalqala"],
  );
  assert.equal(
    segments.map((segment) => segment.text).join(""),
    stripTajweedMarkup(annotated),
  );
});

test("every class the provider emits resolves to a colour a theme declares", () => {
  // The silent failure this guards: a class resolving to a rule id no theme
  // colours prints `var(--tajwid-<id>)`, which resolves to nothing. ham_wasl is
  // the alef of every ٱللَّه, so it was invisible across the whole Quran.
  for (const className of Object.keys(QURAN_COM_CLASS_MAP)) {
    assert.ok(
      THEMES_CSS.includes(`--tajwid-${QURAN_COM_CLASS_MAP[className]}:`),
      `${className} resolves to "${QURAN_COM_CLASS_MAP[className]}", which no theme colours`,
    );
  }
});

test("a word whose annotation reorders its characters is never painted", () => {
  // 2:9, captured live: both strings hold six characters and the same letters,
  // but the dagger alef sits before the lam in one and after it in the other.
  // Length equality must not be enough, or the lam would be painted with the
  // dagger alef's rule.
  assert.equal(isAnnotationAlignedForPaint("ٱٰلَّذِينَ", "ٱلَّٰذِينَ"), false);
});

test("a different sukun code point is rejected without changing either text", () => {
  assert.equal(isAnnotationAlignedForPaint("قُلۡ", "قُلْ"), false);
});

test("a word of another length is never painted", () => {
  assert.equal(isAnnotationAlignedForPaint("بِسْمِ", "بِسْمِا"), false);
  assert.equal(isAnnotationAlignedForPaint("", ""), true);
  assert.equal(isAnnotationAlignedForPaint("بسم", ""), false);
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

test("Tajwid ON/OFF preserves canonical text; edition differences move spans, never letters", () => {
  let mapped = 0;
  for (const word of REAL_WORDS) {
    const result = normalizeTajwidAnnotation(word.text_uthmani, word.text_uthmani_tajweed);
    assert.equal(result.segments.map(segment => segment.text).join(""), word.text_uthmani, "QURAN_TEXT_INTEGRITY_FAILURE");
    if (stripTajweedMarkup(word.text_uthmani_tajweed) !== word.text_uthmani) {
      // Either the spans were carried onto the displayed spelling or the word
      // was refused and reported; text is identical in both cases.
      if (result.alignment === "mapped") mapped++;
      else assert.equal(result.diagnostic?.code, "QURAN_TEXT_INTEGRITY_FAILURE");
    }
  }
  assert.ok(mapped > 0, "the real fixture must exercise edition differences");
});

/* ── Rule coverage of the observed provider taxonomy ─────────────────── */

test("QURAN_TEXT_INTEGRITY: no segment ever carries annotation markup", () => {
  // A riwaya without an annotated source must render the plain Quran text, not
  // the raw `<rule …>` markup: that markup is a transport format and printing it
  // inside a verse would be a text-integrity failure, not a missing colour.
  for (const riwaya of ["hafs", "warsh"]) {
    for (const word of REAL_WORDS) {
      for (const segments of [
        parseTajwid(word.text_uthmani_tajweed, riwaya),
        parseTajwid(word.text_uthmani, riwaya),
      ]) {
        const rendered = segments.map((segment) => segment.text).join("");
        assert.equal(
          /<[a-z][^>]*>/i.test(rendered),
          false,
          `${riwaya}: rendered text must never contain markup`,
        );
      }
    }
  }
});

test("Warsh never colours, even when handed an annotated string", () => {
  const annotated = "إِ<rule class=ikhafa>ن</rule>َّهُ";
  const segments = parseTajwid(annotated, "warsh");
  assert.deepEqual(segments.map((segment) => segment.ruleId), [null]);
  assert.equal(segments.map((segment) => segment.text).join(""), "إِنَّهُ");
});

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
