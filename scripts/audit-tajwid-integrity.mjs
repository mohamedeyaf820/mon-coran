import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { normalizeTajwidAnnotation, parseTajweedAnnotation, stripTajweedMarkup, ruleFromClassName } from "../src/utils/tajwidAnnotation.js";

// Cached official API responses are audit inputs, never a replacement Quran corpus.
const directory = process.argv[2] || ".codex-artifacts/tajwid-audit";
const load = name => JSON.parse(readFileSync(`${directory}/${name}.json`, "utf8").replace(/^\uFEFF/, ""));
const annotations = load("official-annotations").verses;
const canonical = new Map(load("official-canonical").verses.map(verse => [verse.verse_key, verse.text_uthmani]));
const rules = new Map();
const examples = new Map();
let rejected = 0;
let malformed = 0;
let annotated = 0;
const start = performance.now();
for (const verse of annotations) {
  const original = canonical.get(verse.verse_key);
  assert.equal(typeof original, "string");
  const markup = verse.text_uthmani_tajweed.replace(/<span\s+class\s*=\s*(?:"end"|'end'|end)\s*>[^<]*<\/span>/gi, "").trim();
  const parsed = parseTajweedAnnotation(markup);
  assert.equal((parsed || [{ text: markup }]).map(segment => segment.text).join(""), stripTajweedMarkup(markup), `QURAN_TEXT_INTEGRITY_FAILURE:${verse.verse_key}`);
  const result = normalizeTajwidAnnotation(original, markup);
  assert.equal(result.segments.map(segment => segment.text).join(""), original, `QURAN_TEXT_INTEGRITY_FAILURE:${verse.verse_key}`);
  if (result.diagnostic) {
    rejected++;
    if (result.diagnostic.reason === "malformed-annotation") malformed++;
    assert.ok(result.segments.every(segment => segment.ruleId === null));
  } else annotated++;
  for (const match of markup.matchAll(/class\s*=\s*["']?([a-z_]+)/g)) {
    const name = match[1];
    rules.set(name, (rules.get(name) || 0) + 1);
    assert.ok(ruleFromClassName(name), `Unknown provider category: ${name}`);
    if (!examples.has(name)) examples.set(name, { key: verse.verse_key, original, annotation: markup });
  }
  if (/^(1|67|112|113|114):[123]$/.test(verse.verse_key) || ["2:282", "32:3"].includes(verse.verse_key)) {
    examples.set(verse.verse_key, { key: verse.verse_key, original, annotation: markup });
  }
}
const summary = {
  fetchedAt: new Date().toISOString(),
  annotationUrl: "https://api.quran.com/api/v4/quran/verses/uthmani_tajweed",
  canonicalUrl: "https://api.quran.com/api/v4/quran/verses/uthmani",
  annotationSha256: createHash("sha256").update(readFileSync(`${directory}/official-annotations.json`)).digest("hex"),
  canonicalSha256: createHash("sha256").update(readFileSync(`${directory}/official-canonical.json`)).digest("hex"),
  verses: annotations.length, compatibleVerses: annotated, rejectedAnnotations: rejected,
  malformedAnnotations: malformed, renderedTextIntegrityFailures: 0,
  categories: Object.fromEntries(rules), parseAndValidateMs: +(performance.now() - start).toFixed(2),
};
writeFileSync(`${directory}/corpus-summary.json`, JSON.stringify(summary, null, 2));
const fixture = { provenance: summary, verses: [...new Map([...examples.values()].map(verse => [verse.key, verse])).values()] };
writeFileSync("tests/fixtures/tajwid-official-verses.json", JSON.stringify(fixture, null, 2));
console.log(JSON.stringify(summary, null, 2));
